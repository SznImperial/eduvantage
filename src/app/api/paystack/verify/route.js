import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { verifyTransaction, calculatePeriodEnd, PLAN_LIMITS, refundTransaction, fetchSubscription, disableSubscription } from '@/lib/paystackClient';

/**
 * GET /api/paystack/verify?trxref=xxx&reference=xxx
 * 
 * Called when the user is redirected back from Paystack after payment.
 * Verifies the transaction, activates the subscription, processes
 * prorated refunds for upgrades, and redirects to the billing dashboard.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(new URL('/dashboard/admin/billing?payment=error&msg=missing_reference', request.url));
  }

  try {
    // 1. Verify the transaction with Paystack
    const transaction = await verifyTransaction(reference);

    if (transaction.status !== 'success') {
      return NextResponse.redirect(
        new URL(`/dashboard/admin/billing?payment=failed&msg=${transaction.gateway_response || 'Payment was not successful'}`, request.url)
      );
    }

    // 2. Extract metadata
    const metadata = transaction.metadata || {};
    const schoolId = metadata.school_id;
    const tier = metadata.tier;
    const billingCycle = metadata.billing_cycle || 'annual';

    if (!schoolId || !tier) {
      console.error('Missing metadata in Paystack transaction:', { reference, metadata });
      return NextResponse.redirect(
        new URL('/dashboard/admin/billing?payment=error&msg=invalid_metadata', request.url)
      );
    }

    // 3. Get plan limits
    const limits = PLAN_LIMITS[tier];
    if (!limits) {
      return NextResponse.redirect(
        new URL('/dashboard/admin/billing?payment=error&msg=invalid_tier', request.url)
      );
    }

    const adminClient = createAdminClient();
    const now = new Date();
    const periodEnd = calculatePeriodEnd(billingCycle);

    // 4. BEFORE activating the new plan, capture the old payment for refund calculation
    //    We must do this before inserting the new payment, otherwise we'd refund the wrong one.
    let oldPaymentRef = null;
    let oldPaymentAmount = null;

    if (metadata.is_upgrade && metadata.old_period_start && metadata.old_period_end) {
      const { data: previousPayment } = await adminClient
        .from('payment_history')
        .select('paystack_reference, amount')
        .eq('school_id', schoolId)
        .eq('status', 'success')
        .neq('paystack_reference', reference) // Exclude the current transaction
        .order('paid_at', { ascending: false })
        .limit(1)
        .single();

      if (previousPayment && previousPayment.amount) {
        oldPaymentRef = previousPayment.paystack_reference;
        oldPaymentAmount = previousPayment.amount;
      }
    }

    // 5. Activate subscription on the school record
    const { error: updateError } = await adminClient
      .from('schools')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        billing_cycle: billingCycle,
        max_student_limit: limits.maxStudents,
        max_class_limit: limits.maxClasses,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        paystack_customer_code: transaction.customer?.customer_code || null,
      })
      .eq('id', schoolId);

    if (updateError) {
      console.error('Failed to activate subscription:', updateError);
      return NextResponse.redirect(
        new URL('/dashboard/admin/billing?payment=error&msg=activation_failed', request.url)
      );
    }

    // 6. Record payment in history (idempotent — ignore duplicate reference)
    await adminClient
      .from('payment_history')
      .upsert({
        school_id: schoolId,
        paystack_reference: reference,
        amount: transaction.amount,
        currency: transaction.currency || 'NGN',
        status: 'success',
        billing_cycle: billingCycle,
        subscription_tier: tier,
        channel: transaction.channel || null,
        paid_at: transaction.paid_at || now.toISOString(),
        metadata: {
          gateway_response: transaction.gateway_response,
          ip_address: transaction.ip_address,
          authorization: transaction.authorization ? {
            card_type: transaction.authorization.card_type,
            last4: transaction.authorization.last4,
            bank: transaction.authorization.bank,
          } : null,
        },
      }, { onConflict: 'paystack_reference' });

    // 7. Process Prorated Refund for Upgrades
    if (metadata.is_upgrade && oldPaymentRef && oldPaymentAmount) {
      try {
        const start = new Date(metadata.old_period_start).getTime();
        const end = new Date(metadata.old_period_end).getTime();
        const nowMs = now.getTime();

        if (nowMs < end && start < end) {
          const totalDuration = end - start;
          const unusedDuration = end - nowMs;
          const unusedRatio = unusedDuration / totalDuration;
          const refundAmountKobo = Math.floor(oldPaymentAmount * unusedRatio);

          if (refundAmountKobo > 10000) { // Only refund if > ₦100
            console.log(`Processing partial refund of ₦${refundAmountKobo / 100} for school ${schoolId}`);
            await refundTransaction(oldPaymentRef, refundAmountKobo);
          }
        }

        // Disable the old subscription to prevent double billing
        if (metadata.old_subscription_code) {
          const oldSub = await fetchSubscription(metadata.old_subscription_code);
          if (oldSub && oldSub.email_token) {
            await disableSubscription(metadata.old_subscription_code, oldSub.email_token);
          }
        }
      } catch (refundErr) {
        // Log but don't fail the upgrade — the subscription is already active
        console.error('Upgrade proration error (non-fatal):', refundErr);
      }
    }

    // 8. Redirect to billing with success
    return NextResponse.redirect(
      new URL(`/dashboard/admin/billing?payment=success&tier=${tier}&cycle=${billingCycle}`, request.url)
    );

  } catch (err) {
    console.error('Paystack verify error:', err);
    return NextResponse.redirect(
      new URL(`/dashboard/admin/billing?payment=error&msg=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}

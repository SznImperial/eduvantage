import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { verifyWebhookSignature, calculatePeriodEnd, PLAN_LIMITS } from '@/lib/paystackClient';

/**
 * POST /api/paystack/webhook
 * 
 * Handles Paystack webhook events. This is the authoritative source for
 * subscription state changes — it handles successful payments, failed
 * renewals, and subscription cancellations.
 * 
 * Events handled:
 * - charge.success → Activate/renew subscription
 * - invoice.payment_failed → Mark subscription as past_due
 * - subscription.disable → Mark subscription as canceled
 */
export async function POST(request) {
  try {
    // 1. Read raw body and verify signature
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    const isValid = await verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse the event
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const eventData = event.data;

    console.log(`Paystack webhook received: ${eventType}`, { reference: eventData?.reference });

    const adminClient = createAdminClient();

    // 3. Handle events
    switch (eventType) {
      case 'charge.success': {
        await handleChargeSuccess(adminClient, eventData);
        break;
      }

      case 'invoice.payment_failed': {
        await handlePaymentFailed(adminClient, eventData);
        break;
      }

      case 'subscription.disable': {
        await handleSubscriptionDisable(adminClient, eventData);
        break;
      }

      default: {
        console.log(`Unhandled Paystack event: ${eventType}`);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error('Paystack webhook error:', err);
    // Still return 200 to prevent Paystack from retrying endlessly
    return NextResponse.json({ received: true, error: err.message }, { status: 200 });
  }
}

/**
 * Handle a successful charge — activates or renews a subscription.
 */
async function handleChargeSuccess(adminClient, data) {
  const metadata = data.metadata || {};
  const schoolId = metadata.school_id;
  const tier = metadata.tier;
  const billingCycle = metadata.billing_cycle || 'annual';
  const reference = data.reference;

  if (!schoolId || !tier) {
    console.warn('charge.success missing school_id or tier in metadata:', metadata);
    return;
  }

  const limits = PLAN_LIMITS[tier];
  if (!limits) {
    console.warn('charge.success invalid tier:', tier);
    return;
  }

  const now = new Date();
  const periodEnd = calculatePeriodEnd(billingCycle);

  // Activate/renew subscription (idempotent)
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
      paystack_customer_code: data.customer?.customer_code || null,
      paystack_authorization_code: data.authorization?.authorization_code || null,
    })
    .eq('id', schoolId);

  if (updateError) {
    console.error('Failed to activate subscription via webhook:', updateError);
  }

  // Record payment (idempotent via upsert)
  if (reference) {
    await adminClient
      .from('payment_history')
      .upsert({
        school_id: schoolId,
        paystack_reference: reference,
        amount: data.amount || 0,
        currency: data.currency || 'NGN',
        status: 'success',
        billing_cycle: billingCycle,
        subscription_tier: tier,
        channel: data.channel || null,
        paid_at: data.paid_at || now.toISOString(),
        metadata: {
          source: 'webhook',
          gateway_response: data.gateway_response,
        },
      }, { onConflict: 'paystack_reference' });
  }
}

/**
 * Handle a failed recurring payment — marks subscription as past_due.
 */
async function handlePaymentFailed(adminClient, data) {
  const metadata = data.metadata || {};
  const schoolId = metadata.school_id;

  if (!schoolId) {
    // Try to find school by customer code
    const customerCode = data.customer?.customer_code;
    if (customerCode) {
      const { data: school } = await adminClient
        .from('schools')
        .select('id')
        .eq('paystack_customer_code', customerCode)
        .single();

      if (school) {
        await adminClient
          .from('schools')
          .update({ subscription_status: 'past_due' })
          .eq('id', school.id);
      }
    }
    return;
  }

  await adminClient
    .from('schools')
    .update({ subscription_status: 'past_due' })
    .eq('id', schoolId);
}

/**
 * Handle subscription cancellation — marks subscription as canceled.
 */
async function handleSubscriptionDisable(adminClient, data) {
  const customerCode = data.customer?.customer_code;
  
  if (customerCode) {
    const { data: school } = await adminClient
      .from('schools')
      .select('id')
      .eq('paystack_customer_code', customerCode)
      .single();

    if (school) {
      await adminClient
        .from('schools')
        .update({
          subscription_status: 'canceled',
          paystack_subscription_code: null,
        })
        .eq('id', school.id);
    }
  }
}

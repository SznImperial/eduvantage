import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { initializeTransaction, getPriceKobo, PLAN_PRICING } from '@/lib/paystackClient';
import { headers } from 'next/headers';

/**
 * POST /api/paystack/initialize
 * 
 * Initializes a Paystack transaction for a subscription upgrade.
 * Only school admins can call this endpoint.
 * 
 * Body: { tier: string, billingCycle: 'monthly' | 'annual' }
 * Returns: { authorization_url: string, reference: string }
 */
export async function POST(request) {
  try {
    // 1. Authenticate caller
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 2. Get profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only school administrators can manage subscriptions.' }, { status: 403 });
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { tier, billingCycle } = body;

    if (!tier || !billingCycle) {
      return NextResponse.json({ error: 'Missing required fields: tier, billingCycle.' }, { status: 400 });
    }

    if (!PLAN_PRICING[tier]) {
      return NextResponse.json({ error: `Invalid tier: ${tier}. Must be starter, growth, or enterprise.` }, { status: 400 });
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle. Must be monthly or annual.' }, { status: 400 });
    }

    // 4. Calculate amount
    const amountKobo = getPriceKobo(tier, billingCycle);

    // 5. Build callback URL
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const callbackUrl = `${protocol}://${host}/api/paystack/verify`;

    // 6. Fetch school subscription state to detect upgrades
    const { data: school } = await supabase
      .from('schools')
      .select('subscription_status, paystack_subscription_code, current_period_start, current_period_end')
      .eq('id', profile.school_id)
      .single();

    const metadata = {
      school_id: profile.school_id,
      tier,
      billing_cycle: billingCycle,
    };

    // If they already have an active subscription, flag this as an upgrade for prorated refund later
    if (school && school.subscription_status === 'active' && school.paystack_subscription_code) {
      metadata.is_upgrade = true;
      metadata.old_subscription_code = school.paystack_subscription_code;
      metadata.old_period_start = school.current_period_start;
      metadata.old_period_end = school.current_period_end;
    }

    // 7. Initialize Paystack transaction
    const transaction = await initializeTransaction(
      profile.email || user.email,
      amountKobo,
      metadata,
      callbackUrl
    );

    return NextResponse.json({
      authorization_url: transaction.authorization_url,
      reference: transaction.reference,
      access_code: transaction.access_code,
    });

  } catch (err) {
    console.error('Paystack initialize error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize payment.' },
      { status: 500 }
    );
  }
}

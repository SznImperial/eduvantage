-- Add billing cycle and Paystack columns to schools table
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'annual'
    CHECK (billing_cycle IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_authorization_code TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Payment history table for audit trail
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  paystack_reference TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'abandoned')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  subscription_tier TEXT NOT NULL,
  channel TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_school ON public.payment_history(school_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_reference ON public.payment_history(paystack_reference);

-- RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_history_select" ON public.payment_history
  FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());

-- Insert only via admin client (server-side), no RLS insert policy for regular users
CREATE POLICY "payment_history_insert_super" ON public.payment_history
  FOR INSERT WITH CHECK (public.is_super_admin());

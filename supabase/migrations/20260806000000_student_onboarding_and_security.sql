-- Migration: 20260806000000_student_onboarding_and_security.sql
-- Purpose: Add security tracking columns for forced password resets on bulk-imported student accounts

-- 1. Add must_change_password and password_set_at columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMP WITH TIME ZONE;

-- 2. Create index on must_change_password for fast middleware / auth lookup if needed
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password ON public.profiles(must_change_password) WHERE must_change_password = true;

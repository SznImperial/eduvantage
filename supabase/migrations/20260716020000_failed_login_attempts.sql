-- Migration: Create failed_login_attempts table for brute force protection
-- Path: supabase/migrations/20260716020000_failed_login_attempts.sql

CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    email TEXT PRIMARY KEY,
    attempts_count INTEGER NOT NULL DEFAULT 1,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS to prevent public access
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

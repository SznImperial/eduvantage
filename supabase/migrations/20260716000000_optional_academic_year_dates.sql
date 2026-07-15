-- Migration: Optional Academic Year Dates
-- Path: supabase/migrations/20260716000000_optional_academic_year_dates.sql

ALTER TABLE public.academic_years ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.academic_years ALTER COLUMN end_date DROP NOT NULL;

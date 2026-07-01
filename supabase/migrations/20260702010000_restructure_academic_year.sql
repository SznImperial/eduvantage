-- Migration: Restructure Academic Year & Sync Features
-- Path: supabase/migrations/20260702010000_restructure_academic_year.sql

-- 1. Decouple academic_year_id from classes table
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_academic_year_id_fkey;
ALTER TABLE public.classes DROP COLUMN IF EXISTS academic_year_id;

-- 2. Restructure grades table to support term and academic year references
-- Delete existing grades rows to prevent mapping issues
DELETE FROM public.grades;

ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS term TEXT;

-- Drop unique constraint if exists, then recreate
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS unique_student_grade_term;
ALTER TABLE public.grades ADD CONSTRAINT unique_student_grade_term UNIQUE (student_id, class_subject_id, academic_year_id, term);

-- 3. Update profiles table to support phone and admission number
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admission_no TEXT;

-- 4. Create password_reset_requests table (multi-tenant scoped)
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'resolved')),
    temp_password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "password_resets_select" ON public.password_reset_requests;
DROP POLICY IF EXISTS "password_resets_modify" ON public.password_reset_requests;
DROP POLICY IF EXISTS "password_resets_insert" ON public.password_reset_requests;

-- RLS Policies
CREATE POLICY "password_resets_select" ON public.password_reset_requests 
    FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());

CREATE POLICY "password_resets_modify" ON public.password_reset_requests 
    FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

CREATE POLICY "password_resets_insert" ON public.password_reset_requests 
    FOR INSERT WITH CHECK (true);

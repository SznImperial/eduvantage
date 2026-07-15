-- Migration: Implement Historical Academic Terms & Active Sessions
-- Path: supabase/migrations/20260713000000_historical_academic_workflow.sql

-- 1. Create `academic_terms` table
CREATE TABLE IF NOT EXISTS public.academic_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_school_year_term UNIQUE(school_id, academic_year_id, name)
);

ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academic_terms_select" ON public.academic_terms FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "academic_terms_insert" ON public.academic_terms FOR INSERT WITH CHECK ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());
CREATE POLICY "academic_terms_update" ON public.academic_terms FOR UPDATE USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());
CREATE POLICY "academic_terms_delete" ON public.academic_terms FOR DELETE USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- 2. Add active_academic_year_id and active_academic_term_id to schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS active_academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS active_academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL;

-- 3. Add academic_year_id to enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE;

-- 4. Add academic_year_id to class_subjects
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE;

-- 5. Handle `grades` and `fee_records`
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE;
ALTER TABLE public.fee_records ADD COLUMN IF NOT EXISTS academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE;

-- Data Migration Block
DO $$
DECLARE
    school RECORD;
    latest_year UUID;
    term_1 UUID;
    term_2 UUID;
    term_3 UUID;
BEGIN
    FOR school IN SELECT id FROM public.schools LOOP
        -- Find the latest academic year for the school
        SELECT id INTO latest_year FROM public.academic_years WHERE school_id = school.id ORDER BY name DESC LIMIT 1;
        
        IF latest_year IS NOT NULL THEN
            -- Create default terms for this year
            INSERT INTO public.academic_terms (school_id, academic_year_id, name) VALUES (school.id, latest_year, '1st Term') ON CONFLICT DO NOTHING RETURNING id INTO term_1;
            IF term_1 IS NULL THEN SELECT id INTO term_1 FROM public.academic_terms WHERE school_id = school.id AND academic_year_id = latest_year AND name = '1st Term'; END IF;
            
            INSERT INTO public.academic_terms (school_id, academic_year_id, name) VALUES (school.id, latest_year, '2nd Term') ON CONFLICT DO NOTHING RETURNING id INTO term_2;
            IF term_2 IS NULL THEN SELECT id INTO term_2 FROM public.academic_terms WHERE school_id = school.id AND academic_year_id = latest_year AND name = '2nd Term'; END IF;
            
            INSERT INTO public.academic_terms (school_id, academic_year_id, name) VALUES (school.id, latest_year, '3rd Term') ON CONFLICT DO NOTHING RETURNING id INTO term_3;
            IF term_3 IS NULL THEN SELECT id INTO term_3 FROM public.academic_terms WHERE school_id = school.id AND academic_year_id = latest_year AND name = '3rd Term'; END IF;

            -- Update school active session
            UPDATE public.schools SET active_academic_year_id = latest_year, active_academic_term_id = term_1 WHERE id = school.id AND active_academic_year_id IS NULL;

            -- Update enrollments
            UPDATE public.enrollments SET academic_year_id = latest_year WHERE school_id = school.id AND academic_year_id IS NULL;
            
            -- Update class_subjects
            UPDATE public.class_subjects SET academic_year_id = latest_year WHERE school_id = school.id AND academic_year_id IS NULL;

            -- Update grades
            UPDATE public.grades SET academic_term_id = CASE
                WHEN term = '1st Term' THEN term_1
                WHEN term = '2nd Term' THEN term_2
                WHEN term = '3rd Term' THEN term_3
                ELSE term_1
            END WHERE school_id = school.id AND academic_term_id IS NULL;

            -- Update fee_records
            UPDATE public.fee_records SET academic_term_id = CASE
                WHEN term = '1st Term' THEN term_1
                WHEN term = '2nd Term' THEN term_2
                WHEN term = '3rd Term' THEN term_3
                ELSE term_1
            END WHERE school_id = school.id AND academic_term_id IS NULL;
        END IF;
    END LOOP;
END $$;

-- 6. Now that data is migrated, drop old unique constraints and recreate them
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS unique_enrollment;
ALTER TABLE public.enrollments ADD CONSTRAINT unique_enrollment UNIQUE(student_id, academic_year_id);

ALTER TABLE public.class_subjects DROP CONSTRAINT IF EXISTS unique_class_subject;
ALTER TABLE public.class_subjects ADD CONSTRAINT unique_class_subject UNIQUE(class_id, subject_id, academic_year_id);

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS unique_student_grade_term;
ALTER TABLE public.grades ADD CONSTRAINT unique_student_grade_term UNIQUE(student_id, class_subject_id, academic_term_id);
ALTER TABLE public.grades DROP COLUMN IF EXISTS term;

ALTER TABLE public.fee_records DROP CONSTRAINT IF EXISTS fee_records_term_check;
ALTER TABLE public.fee_records DROP CONSTRAINT IF EXISTS unique_student_fee_term;
ALTER TABLE public.fee_records ADD CONSTRAINT unique_student_fee_term UNIQUE(student_id, academic_term_id);
ALTER TABLE public.fee_records DROP COLUMN IF EXISTS term;

-- Make foreign keys required now that migration is complete (for robust future inserts)
-- We skip this to avoid errors on corrupt rows, but logic should always insert it.
-- ALTER TABLE public.enrollments ALTER COLUMN academic_year_id SET NOT NULL;

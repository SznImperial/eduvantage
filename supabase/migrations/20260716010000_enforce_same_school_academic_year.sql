-- Migration: Enforce same-school academic year references
-- This trigger prevents cross-tenant data leakage by ensuring that
-- any academic_year_id written to class_subjects, enrollments, grades,
-- or fee_records belongs to the same school_id as the row itself.

CREATE OR REPLACE FUNCTION public.enforce_same_school_academic_year()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.academic_year_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.academic_years
      WHERE id = NEW.academic_year_id AND school_id = NEW.school_id
    ) THEN
      RAISE EXCEPTION 'Cross-tenant violation: academic_year_id does not belong to this school';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply to class_subjects
DROP TRIGGER IF EXISTS trg_class_subjects_same_school_year ON public.class_subjects;
CREATE TRIGGER trg_class_subjects_same_school_year
  BEFORE INSERT OR UPDATE ON public.class_subjects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_school_academic_year();

-- Apply to enrollments
DROP TRIGGER IF EXISTS trg_enrollments_same_school_year ON public.enrollments;
CREATE TRIGGER trg_enrollments_same_school_year
  BEFORE INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_school_academic_year();

-- Apply to grades
DROP TRIGGER IF EXISTS trg_grades_same_school_year ON public.grades;
CREATE TRIGGER trg_grades_same_school_year
  BEFORE INSERT OR UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_school_academic_year();

-- Apply to fee_records
DROP TRIGGER IF EXISTS trg_fee_records_same_school_year ON public.fee_records;
CREATE TRIGGER trg_fee_records_same_school_year
  BEFORE INSERT OR UPDATE ON public.fee_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_school_academic_year();

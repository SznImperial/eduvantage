-- 20260702020000_strict_rls_fks.sql
-- Tightens RLS policies on mapping tables to prevent cross-tenant foreign key insertions

-- 1. Create indexes for foreign keys to optimize the RLS EXISTS clauses
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_grades_class_subject ON public.grades(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_academic_year ON public.grades(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON public.class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON public.class_subjects(teacher_id);

CREATE INDEX IF NOT EXISTS idx_attendance_class ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);

-- 2. Drop existing broadly scoped policies
DROP POLICY IF EXISTS "enrollments_all_admin" ON public.enrollments;
DROP POLICY IF EXISTS "class_subjects_all_admin" ON public.class_subjects;
DROP POLICY IF EXISTS "grades_modify_staff" ON public.grades;
DROP POLICY IF EXISTS "attendance_modify_staff" ON public.attendance;

-- 3. Recreate policies with strict WITH CHECK clauses for tenant boundaries

-- Enrollments
CREATE POLICY "enrollments_all_admin" ON public.enrollments FOR ALL
USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin')
WITH CHECK (
  school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin' AND
  EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.school_id = public.get_auth_school_id()) AND
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.school_id = public.get_auth_school_id())
);

-- Class Subjects
CREATE POLICY "class_subjects_all_admin" ON public.class_subjects FOR ALL
USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin')
WITH CHECK (
  school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin' AND
  EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.school_id = public.get_auth_school_id()) AND
  EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.school_id = public.get_auth_school_id()) AND
  (teacher_id IS NULL OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = teacher_id AND p.school_id = public.get_auth_school_id()))
);

-- Grades
CREATE POLICY "grades_modify_staff" ON public.grades FOR ALL
USING (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher'))
WITH CHECK (
  school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher') AND
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.school_id = public.get_auth_school_id()) AND
  EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.id = class_subject_id AND cs.school_id = public.get_auth_school_id()) AND
  EXISTS (SELECT 1 FROM public.academic_years ay WHERE ay.id = academic_year_id AND ay.school_id = public.get_auth_school_id())
);

-- Attendance
CREATE POLICY "attendance_modify_staff" ON public.attendance FOR ALL
USING (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher'))
WITH CHECK (
  school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher') AND
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.school_id = public.get_auth_school_id()) AND
  EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.school_id = public.get_auth_school_id())
);

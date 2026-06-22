-- 1. Add subscription and limits columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'growth', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled')),
ADD COLUMN IF NOT EXISTS max_student_limit INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_class_limit INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Create parent_student mapping table
CREATE TABLE IF NOT EXISTS public.parent_student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_parent_student UNIQUE(parent_id, student_id)
);

-- Enable RLS for parent_student
ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;

-- 3. Create helper function to check if the authenticated user is a platform super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;

-- 4. Recreate/Update Row-Level Security Policies to support super_admin bypass and parent access

-- Schools
DROP POLICY IF EXISTS "school_select" ON public.schools;
DROP POLICY IF EXISTS "school_insert" ON public.schools;
DROP POLICY IF EXISTS "school_update" ON public.schools;

CREATE POLICY "school_select" ON public.schools FOR SELECT USING (id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "school_insert" ON public.schools FOR INSERT WITH CHECK (true);
CREATE POLICY "school_update" ON public.schools FOR UPDATE USING ((id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());
CREATE POLICY "school_delete" ON public.schools FOR DELETE USING (public.is_super_admin());

-- Profiles
DROP POLICY IF EXISTS "profile_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "profile_update" ON public.profiles;
DROP POLICY IF EXISTS "profile_delete" ON public.profiles;

CREATE POLICY "profile_select" ON public.profiles FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_super_admin());
CREATE POLICY "profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());
CREATE POLICY "profile_delete" ON public.profiles FOR DELETE USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- Academic Years
DROP POLICY IF EXISTS "academic_years_select" ON public.academic_years;
DROP POLICY IF EXISTS "academic_years_all_admin" ON public.academic_years;

CREATE POLICY "academic_years_select" ON public.academic_years FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "academic_years_all_admin" ON public.academic_years FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- Classes
DROP POLICY IF EXISTS "classes_select" ON public.classes;
DROP POLICY IF EXISTS "classes_all_admin" ON public.classes;

CREATE POLICY "classes_select" ON public.classes FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "classes_all_admin" ON public.classes FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- Subjects
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_all_admin" ON public.subjects;

CREATE POLICY "subjects_select" ON public.subjects FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "subjects_all_admin" ON public.subjects FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- Class Subjects
DROP POLICY IF EXISTS "class_subjects_select" ON public.class_subjects;
DROP POLICY IF EXISTS "class_subjects_all_admin" ON public.class_subjects;

CREATE POLICY "class_subjects_select" ON public.class_subjects FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "class_subjects_all_admin" ON public.class_subjects FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- Enrollments
DROP POLICY IF EXISTS "enrollments_select" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_all_admin" ON public.enrollments;

CREATE POLICY "enrollments_select" ON public.enrollments FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "enrollments_all_admin" ON public.enrollments FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- Attendance
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_modify_staff" ON public.attendance;

CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    OR public.is_super_admin()
    OR (
        public.get_auth_role() = 'parent' 
        AND student_id IN (SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid())
    )
);
CREATE POLICY "attendance_modify_staff" ON public.attendance FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher')) OR public.is_super_admin());

-- Grades
DROP POLICY IF EXISTS "grades_select" ON public.grades;
DROP POLICY IF EXISTS "grades_modify_staff" ON public.grades;

CREATE POLICY "grades_select" ON public.grades FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    OR public.is_super_admin()
    OR (
        public.get_auth_role() = 'parent' 
        AND student_id IN (SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid())
    )
);
CREATE POLICY "grades_modify_staff" ON public.grades FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher')) OR public.is_super_admin());

-- Announcements
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_modify_admin" ON public.announcements;

CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "announcements_modify_admin" ON public.announcements FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

-- parent_student policies
DROP POLICY IF EXISTS "parent_student_select" ON public.parent_student;
DROP POLICY IF EXISTS "parent_student_modify" ON public.parent_student;

CREATE POLICY "parent_student_select" ON public.parent_student FOR SELECT USING (school_id = public.get_auth_school_id() OR public.is_super_admin());
CREATE POLICY "parent_student_modify" ON public.parent_student FOR ALL USING ((school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin') OR public.is_super_admin());

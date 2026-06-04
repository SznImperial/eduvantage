-- Disable search path warnings for security definer functions
-- Initialize schema for EduVantage school management SaaS

-- 1. Create Schools (Tenants) table
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Profiles table (maps to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'teacher', 'student', 'parent')),
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Academic Years table
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- 4. Create Classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    grade_level TEXT NOT NULL
);

-- 5. Create Subjects table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL
);

-- 6. Create Class Subjects mapping table
CREATE TABLE public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT unique_class_subject UNIQUE(class_id, subject_id)
);

-- 7. Create Enrollments table (Students in Classes)
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_enrollment UNIQUE(student_id, class_id)
);

-- 8. Create Attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_attendance_date UNIQUE(student_id, class_id, date)
);

-- 9. Create Grades table
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE CASCADE NOT NULL,
    grade_value NUMERIC(5,2) NOT NULL CHECK (grade_value >= 0 AND grade_value <= 100),
    remarks TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create Announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_profiles_school ON public.profiles(school_id);
CREATE INDEX idx_classes_school ON public.classes(school_id);
CREATE INDEX idx_enrollments_school ON public.enrollments(school_id);
CREATE INDEX idx_attendance_school_date ON public.attendance(school_id, date);
CREATE INDEX idx_grades_student ON public.grades(student_id);

-- RLS Helper Functions (SECURITY DEFINER to prevent recursive queries)
CREATE OR REPLACE FUNCTION public.get_auth_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable Row-Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Schools
CREATE POLICY "school_select" ON public.schools FOR SELECT USING (id = public.get_auth_school_id());
CREATE POLICY "school_insert" ON public.schools FOR INSERT WITH CHECK (true);
CREATE POLICY "school_update" ON public.schools FOR UPDATE USING (id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

-- Profiles
CREATE POLICY "profile_select" ON public.profiles FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin'));
CREATE POLICY "profile_delete" ON public.profiles FOR DELETE USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

-- Academic Years
CREATE POLICY "academic_years_select" ON public.academic_years FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "academic_years_all_admin" ON public.academic_years FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

-- Classes
CREATE POLICY "classes_select" ON public.classes FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "classes_all_admin" ON public.classes FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

-- Subjects
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "subjects_all_admin" ON public.subjects FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

-- Class Subjects
CREATE POLICY "class_subjects_select" ON public.class_subjects FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "class_subjects_all_admin" ON public.class_subjects FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

-- Enrollments
CREATE POLICY "enrollments_select" ON public.enrollments FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "enrollments_all_admin" ON public.enrollments FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

-- Attendance
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "attendance_modify_staff" ON public.attendance FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher'));

-- Grades
CREATE POLICY "grades_select" ON public.grades FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "grades_modify_staff" ON public.grades FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() IN ('admin', 'teacher'));

-- Announcements
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (school_id = public.get_auth_school_id());
CREATE POLICY "announcements_modify_admin" ON public.announcements FOR ALL USING (school_id = public.get_auth_school_id() AND public.get_auth_role() = 'admin');

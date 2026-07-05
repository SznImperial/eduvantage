-- 20260702030000_secure_storage_and_rls.sql
-- Fixes public storage bucket exposure and horizontal privilege escalation in RLS

-- 1. Secure the Submissions Storage Bucket
UPDATE storage.buckets SET public = false WHERE id = 'submissions';

DROP POLICY IF EXISTS "Submissions Storage Public Read Access" ON storage.objects;
CREATE POLICY "Submissions Storage Secure Read Access"
ON storage.objects FOR SELECT USING (
    bucket_id = 'submissions' 
    AND auth.role() = 'authenticated' 
    AND (
        owner = auth.uid() 
        OR public.get_auth_role() IN ('admin', 'teacher') 
        OR public.is_super_admin()
    )
);

-- 2. Fix Horizontal Privilege Escalation in Fee Records
DROP POLICY IF EXISTS "fee_records_select" ON public.fee_records;
CREATE POLICY "fee_records_select" ON public.fee_records FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    AND (
        public.is_super_admin() 
        OR public.get_auth_role() = 'admin' 
        OR (public.get_auth_role() = 'student' AND student_id = auth.uid()) 
        OR (public.get_auth_role() = 'parent' AND student_id IN (SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid()))
    )
);

-- 3. Fix Over-Permissive Directory Exposure in Profiles
DROP POLICY IF EXISTS "profile_select" ON public.profiles;
CREATE POLICY "profile_select" ON public.profiles FOR SELECT USING (
    public.is_super_admin() 
    OR (
        school_id = public.get_auth_school_id() 
        AND (
            public.get_auth_role() IN ('admin', 'teacher') 
            OR id = auth.uid() 
            OR (public.get_auth_role() = 'student' AND role IN ('teacher', 'student')) 
            OR (public.get_auth_role() = 'parent' AND role IN ('teacher', 'admin', 'student'))
        )
    )
);

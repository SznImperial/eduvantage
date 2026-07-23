-- 1. Add school_type to schools table
ALTER TABLE public.schools
ADD COLUMN school_type TEXT NOT NULL DEFAULT 'secondary' 
CHECK (school_type IN ('primary', 'secondary', 'both'));

-- 2. Add class_type to classes table
ALTER TABLE public.classes
ADD COLUMN class_type TEXT NOT NULL DEFAULT 'secondary' 
CHECK (class_type IN ('primary', 'secondary'));

-- 3. Add class_teacher_id to classes table
ALTER TABLE public.classes
ADD COLUMN class_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Update the SaaS RPC to accept the new columns
CREATE OR REPLACE FUNCTION public.create_class_atomic(
    p_school_id UUID, 
    p_name TEXT, 
    p_grade_level TEXT,
    p_class_type TEXT DEFAULT 'secondary',
    p_class_teacher_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_active_year_id UUID;
    v_class_count INT;
    v_max_classes INT;
    v_new_id UUID;
BEGIN
    -- Get active academic year and limits
    SELECT active_academic_year_id, max_class_limit 
    INTO v_active_year_id, v_max_classes 
    FROM public.schools 
    WHERE id = p_school_id;

    IF v_active_year_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No active academic year found for this school.');
    END IF;

    -- Enforce Class Limits
    SELECT count(*) INTO v_class_count 
    FROM public.classes 
    WHERE school_id = p_school_id;

    IF v_class_count >= v_max_classes THEN
        RETURN json_build_object('success', false, 'error', 'SaaS Limit Exceeded: Maximum number of classes reached for your subscription tier. Upgrade your plan to create more classes.');
    END IF;

    -- Insert Class
    INSERT INTO public.classes (school_id, name, grade_level, class_type, class_teacher_id)
    VALUES (p_school_id, p_name, p_grade_level, p_class_type, p_class_teacher_id)
    RETURNING id INTO v_new_id;

    RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create attendance flags table
CREATE TABLE IF NOT EXISTS public.attendance_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('spike', 'decline')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for dashboard
CREATE INDEX idx_attendance_flags_school_status ON public.attendance_flags(school_id, status);
CREATE INDEX idx_attendance_flags_student_type ON public.attendance_flags(student_id, flag_type);

-- RLS Policies
ALTER TABLE public.attendance_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_flags_select" ON public.attendance_flags 
FOR SELECT USING (
    school_id = public.get_auth_school_id() 
    AND public.get_auth_role() = 'admin'
);

CREATE POLICY "attendance_flags_modify" ON public.attendance_flags 
FOR ALL USING (
    school_id = public.get_auth_school_id() 
    AND public.get_auth_role() = 'admin'
);

-- Configure pg_cron to hit the Next.js API endpoint every day at midnight (0 0 * * *)
-- Note: Requires pg_cron and pg_net extensions to be enabled in Supabase.
-- For local testing, host.docker.internal resolves to the host machine.
-- In production, the URL should be updated to the actual deployment URL.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- We use DO block to gracefully handle scheduling without failing if extensions are restricted
DO $$
BEGIN
    -- Schedule the daily attendance anomaly detection job
    PERFORM cron.schedule(
        'attendance_anomaly_daily_check',
        '0 0 * * *',
        $cron$
        SELECT net.http_post(
            url:='http://host.docker.internal:3000/api/cron/attendance-flags',
            body:='{}'::jsonb,
            headers:='{"Authorization": "Bearer super_secret_cron_token_12345", "Content-Type": "application/json"}'::jsonb
        );
        $cron$
    );
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if pg_cron is not supported or not fully enabled by the hosting provider
    RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END $$;

-- Create a secure function to delete users from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS trigger AS $$
BEGIN
  -- Delete the auth user that matches the profile ID
  -- SECURITY DEFINER allows this function to bypass RLS and access the auth schema
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_deleted_profile();

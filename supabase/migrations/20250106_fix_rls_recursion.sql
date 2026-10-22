-- Fix infinite recursion in RLS policies
-- This migration fixes the recursive policies that were causing 500 errors

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Master users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Master users can view all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Master users can update all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Master users can insert licenses" ON public.licenses;

-- Create a function to check if user is master without recursion
CREATE OR REPLACE FUNCTION public.is_master_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_master BOOLEAN;
BEGIN
  -- Direct query without RLS to avoid recursion
  SELECT COALESCE(is_master, false) INTO is_master
  FROM public.user_profiles
  WHERE id = user_id;

  RETURN COALESCE(is_master, false);
END;
$$;

-- Create new non-recursive policies for user_profiles
CREATE POLICY "Master users can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_master_user(auth.uid()));

-- Create new non-recursive policies for licenses
CREATE POLICY "Master users can view all licenses"
  ON public.licenses FOR SELECT
  USING (public.is_master_user(auth.uid()));

CREATE POLICY "Master users can update all licenses"
  ON public.licenses FOR UPDATE
  USING (public.is_master_user(auth.uid()));

CREATE POLICY "Master users can insert licenses"
  ON public.licenses FOR INSERT
  WITH CHECK (public.is_master_user(auth.uid()));

-- Add policy to allow users to insert their own profile (needed for registration)
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_master_user(UUID) TO authenticated;

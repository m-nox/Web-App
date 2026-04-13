-- Fix Infinite Recursion in Karyawan RLS
-- The previous policy used a function that queried the table it was protecting.

-- 1. Drop the offending policy
DROP POLICY IF EXISTS "Admins can view all data" ON karyawan;

-- 2. Create a refined Admin check function that avoids recursion
-- We use a direct check against the table but ensure the function is SECURITY DEFINER 
-- and we use it only for non-self checks.
CREATE OR REPLACE FUNCTION is_admin_v2() 
RETURNS BOOLEAN AS $$
BEGIN
  -- We check if the current auth.uid has an admin role in the table
  -- To avoid recursion, this function should be used carefully
  RETURN EXISTS (
    SELECT 1 FROM karyawan 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'hr')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Karyawan Policy
-- Self-view is always allowed and is evaluated first (non-recursive)
-- Admin-view uses the SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can view their own data" ON karyawan;
CREATE POLICY "Users can view their own data" ON karyawan 
FOR SELECT USING (
  (auth.uid() = id) 
  OR 
  (
    -- Check if the seeker is an admin
    EXISTS (
      SELECT 1 FROM (
        SELECT role FROM karyawan WHERE id = auth.uid()
      ) s WHERE s.role IN ('admin', 'hr')
    )
  )
);

-- Actually, the best way to avoid recursion in Supabase when the role is in the same table:
-- Use the JWT metadata if available, or a separate roles table.
-- Given the current structure, we'll try a more explicit non-recursive check.

DROP POLICY IF EXISTS "Users can view their own data" ON karyawan;
CREATE POLICY "Users can view their own data" ON karyawan 
FOR SELECT USING (
  auth.uid() = id 
  OR 
  (SELECT role FROM karyawan WHERE id = auth.uid()) IN ('admin', 'hr')
);

-- Wait! The SELECT inside the policy STILL triggers the policy! 
-- This is what causes recursion.

-- FINAL RESOLUTION:
-- We will use the 'email' check for admins if they are accessing others,
-- or just rely on the fact that is_admin_or_hr() as SECURITY DEFINER
-- should work IF it doesn't trigger itself.

-- The error "infinite recursion" usually happens because the policy on 'karyawan' 
-- is being checked WHILE the function is trying to read 'karyawan'.

DROP POLICY IF EXISTS "Users can view their own data" ON karyawan;
CREATE POLICY "Users can view their own data" ON karyawan 
FOR SELECT USING (auth.uid() = id);

-- Then add a SEPARATE policy for admins
DROP POLICY IF EXISTS "Admins view all" ON karyawan;
CREATE POLICY "Admins view all" ON karyawan 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'hr')
  )
);

-- NOTE: This requires that 'role' is also present in auth.users metadata.
-- For now, let's just use a simpler check that avoids the join loop.

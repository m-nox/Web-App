-- Standardize Employee Access to Salary Slips
-- Ensure employees can read their own payroll records regardless of UUID source differences
-- (Matching by checking if auth.email matches the karyawan email associated with the gaji record)

-- 1. DROP old policy if exists
DROP POLICY IF EXISTS "Users can view their own gaji" ON gaji;

-- 2. CREATE robust policy
-- This policy checks if the current user's email matches the email of the employee record linked to the gaji entry
CREATE POLICY "Users can view their own gaji" ON gaji
FOR SELECT USING (
  karyawan_id IN (
    SELECT id FROM karyawan 
    WHERE email = auth.jwt() ->> 'email'
  )
  OR 
  (auth.uid() = karyawan_id)
);

-- Note: We also have the "Admins can view all gaji" policy from the previous migration

-- Fix RLS Policies for Admin/HR Access
-- This script creates a helper function and adds policies to allow Admin/HR to view all records

-- 1. Helper Function to check if current user is Admin or HR
CREATE OR REPLACE FUNCTION is_admin_or_hr() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM karyawan 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'hr')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Karyawan Policies
-- Allow admins to see all employees (required for joins in Payroll)
DROP POLICY IF EXISTS "Admins can view all data" ON karyawan;
CREATE POLICY "Admins can view all data" ON karyawan 
FOR SELECT USING (is_admin_or_hr());

-- 3. Update Gaji Policies
-- Allow admins to see all payroll records
DROP POLICY IF EXISTS "Admins can view all gaji" ON gaji;
CREATE POLICY "Admins can view all gaji" ON gaji 
FOR SELECT USING (is_admin_or_hr());

-- 4. Update Absensi Policies (Optional but good for consistency)
DROP POLICY IF EXISTS "Admins can view all absensi" ON absensi;
CREATE POLICY "Admins can view all absensi" ON absensi 
FOR SELECT USING (is_admin_or_hr());

-- 5. Update Cuti Policies
DROP POLICY IF EXISTS "Admins can view all cuti" ON cuti;
CREATE POLICY "Admins can view all cuti" ON cuti 
FOR SELECT USING (is_admin_or_hr());

-- Update Unique Constraint for Payroll to Month-Year level
-- This prevents the same employee from having multiple payroll records in the same month

-- 1. Remove old date-level constraint
ALTER TABLE gaji DROP CONSTRAINT IF EXISTS unique_karyawan_periode;

-- 2. Create a unique index based on month-year
-- We use a functional index to truncate the date to the first day of the month
CREATE UNIQUE INDEX IF NOT EXISTS unique_karyawan_month_year 
ON gaji (karyawan_id, (date_trunc('month', periode_gaji)));

-- Add a comment for documentation
COMMENT ON INDEX unique_karyawan_month_year IS 'Mencegah duplikasi gajian untuk karyawan yang sama di bulan yang sama';

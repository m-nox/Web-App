-- Link Jabatan to Departemen
-- This migration adds a departemen_id to the jabatan table and maps existing records

DO $$ 
BEGIN
    -- 1. Tambah kolom departemen_id ke tabel jabatan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jabatan' AND column_name='departemen_id') THEN
        ALTER TABLE jabatan ADD COLUMN departemen_id UUID REFERENCES departemen(id) ON DELETE SET NULL;
    END IF;

    -- 2. Pemetaan Jabatan ke Departemen (Berdasarkan data yang sudah ada)
    -- Engineering: Software Engineer, Senior Software Engineer
    UPDATE jabatan SET departemen_id = (SELECT id FROM departemen WHERE nama_departemen = 'Engineering')
    WHERE nama_jabatan IN ('Software Engineer', 'Senior Software Engineer');

    -- Product: Product Manager
    UPDATE jabatan SET departemen_id = (SELECT id FROM departemen WHERE nama_departemen = 'Product')
    WHERE nama_jabatan = 'Product Manager';

    -- Human Resources: HR Specialist
    UPDATE jabatan SET departemen_id = (SELECT id FROM departemen WHERE nama_departemen = 'Human Resources')
    WHERE nama_jabatan = 'HR Specialist';

    -- Finance: Accountant
    UPDATE jabatan SET departemen_id = (SELECT id FROM departemen WHERE nama_departemen = 'Finance')
    WHERE nama_jabatan = 'Accountant';

END $$;

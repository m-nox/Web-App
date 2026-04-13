-- Add Alpha Deduction columns to gaji table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='jumlah_alfa') THEN
        ALTER TABLE gaji ADD COLUMN jumlah_alfa INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='potongan_alfa') THEN
        ALTER TABLE gaji ADD COLUMN potongan_alfa NUMERIC DEFAULT 0;
    END IF;
END $$;

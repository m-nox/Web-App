DO $$ 
BEGIN
    -- Menambah kolom ke tabel JABATAN (jika belum ada)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jabatan' AND column_name='gaji_pokok') THEN
        ALTER TABLE jabatan ADD COLUMN gaji_pokok NUMERIC NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jabatan' AND column_name='tunjangan_keluarga') THEN
        ALTER TABLE jabatan ADD COLUMN tunjangan_keluarga NUMERIC NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jabatan' AND column_name='tunjangan_jabatan') THEN
        ALTER TABLE jabatan ADD COLUMN tunjangan_jabatan NUMERIC NOT NULL DEFAULT 0;
    END IF;

    -- Menambah kolom ke tabel KARYAWAN (jika belum ada)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='karyawan' AND column_name='nama_bank') THEN
        ALTER TABLE karyawan ADD COLUMN nama_bank TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='karyawan' AND column_name='nomor_rekening') THEN
        ALTER TABLE karyawan ADD COLUMN nomor_rekening TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='karyawan' AND column_name='password') THEN
        ALTER TABLE karyawan ADD COLUMN password TEXT DEFAULT 'Hris123!';
    END IF;

    -- Menambah kolom rincian ke tabel GAJI (jika belum ada)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='jumlah_hadir') THEN
        ALTER TABLE gaji ADD COLUMN jumlah_hadir INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='jumlah_terlambat') THEN
        ALTER TABLE gaji ADD COLUMN jumlah_terlambat INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='tunjangan_makan') THEN
        ALTER TABLE gaji ADD COLUMN tunjangan_makan NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='tunjangan_transport') THEN
        ALTER TABLE gaji ADD COLUMN tunjangan_transport NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='tunjangan_keluarga') THEN
        ALTER TABLE gaji ADD COLUMN tunjangan_keluarga NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='tunjangan_jabatan') THEN
        ALTER TABLE gaji ADD COLUMN tunjangan_jabatan NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='potongan_bpjs_ks') THEN
        ALTER TABLE gaji ADD COLUMN potongan_bpjs_ks NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='potongan_bpjs_tk') THEN
        ALTER TABLE gaji ADD COLUMN potongan_bpjs_tk NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='pajak_pph21') THEN
        ALTER TABLE gaji ADD COLUMN pajak_pph21 NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='nama_bank') THEN
        ALTER TABLE gaji ADD COLUMN nama_bank TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='nomor_rekening') THEN
        ALTER TABLE gaji ADD COLUMN nomor_rekening TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gaji' AND column_name='status_pembayaran') THEN
        ALTER TABLE gaji ADD COLUMN status_pembayaran TEXT DEFAULT 'Pending';
    END IF;

    -- Tambahkan Unique Constraint untuk mencegah duplikasi payroll
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='unique_karyawan_periode' AND table_name='gaji') THEN
        ALTER TABLE gaji ADD CONSTRAINT unique_karyawan_periode UNIQUE (karyawan_id, periode_gaji);
    END IF;

END $$;

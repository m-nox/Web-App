-- Create tables

CREATE TABLE jabatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_jabatan TEXT NOT NULL,
    level TEXT NOT NULL
);

CREATE TABLE departemen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_departemen TEXT NOT NULL,
    kepala_departemen_id UUID -- Foreign key added later to avoid circular dependency
);

CREATE TABLE karyawan (
    id UUID PRIMARY KEY DEFAULT auth.uid(), -- matches auth.users
    nama_depan TEXT NOT NULL,
    nama_belakang TEXT,
    email TEXT UNIQUE NOT NULL,
    no_telepon TEXT,
    tanggal_lahir DATE,
    alamat TEXT,
    tanggal_masuk DATE DEFAULT CURRENT_DATE,
    jabatan_id UUID REFERENCES jabatan(id),
    departemen_id UUID REFERENCES departemen(id)
);

-- Add foreign key back to departemen
ALTER TABLE departemen
ADD CONSTRAINT fk_kepala_departemen
FOREIGN KEY (kepala_departemen_id) 
REFERENCES karyawan(id);

CREATE TABLE absensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    karyawan_id UUID REFERENCES karyawan(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam_masuk TIME,
    jam_keluar TIME,
    status TEXT NOT NULL
);

CREATE TABLE cuti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    karyawan_id UUID REFERENCES karyawan(id) ON DELETE CASCADE,
    tipe_cuti TEXT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    status TEXT DEFAULT 'Pending'
);

CREATE TABLE gaji (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    karyawan_id UUID REFERENCES karyawan(id) ON DELETE CASCADE,
    periode_gaji DATE NOT NULL,
    gaji_pokok NUMERIC NOT NULL DEFAULT 0,
    tunjangan NUMERIC NOT NULL DEFAULT 0,
    potongan NUMERIC NOT NULL DEFAULT 0,
    total_gaji NUMERIC NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE jabatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE departemen ENABLE ROW LEVEL SECURITY;
ALTER TABLE karyawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuti ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaji ENABLE ROW LEVEL SECURITY;

-- Basic Policies (can be refined later for Admin/Manager/Karyawan)
CREATE POLICY "Enable read access for all users" ON jabatan FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON departemen FOR SELECT USING (true);
CREATE POLICY "Users can view their own data" ON karyawan FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Users can view their own absensi" ON absensi FOR SELECT USING ((select auth.uid()) = karyawan_id);
CREATE POLICY "Users can view their own cuti" ON cuti FOR SELECT USING ((select auth.uid()) = karyawan_id);
CREATE POLICY "Users can view their own gaji" ON gaji FOR SELECT USING ((select auth.uid()) = karyawan_id);

-- Enable Realtime
alter publication supabase_realtime add table absensi;
alter publication supabase_realtime add table cuti;

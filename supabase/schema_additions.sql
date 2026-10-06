-- =================================================================
-- GudangApp v2 — Schema Additions
-- Jalankan ini di Supabase SQL Editor
-- =================================================================

-- 1. Tambah superadmin ke role enum
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'admin', 'staff'));

-- 2. Buat tabel categories
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        UNIQUE NOT NULL,
  created_by  UUID        NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS untuk categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_authenticated"
  ON public.categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- 4. Update RLS profiles: hanya superadmin yang bisa update role orang lain
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    -- Staff/admin bisa update data diri sendiri, tapi tidak bisa ubah role sendiri
    (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR
    -- Superadmin bisa update siapa saja
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 5. Seed categories awal (opsional — sesuaikan dengan kategori gudang lu)
-- Jalankan ini jika mau seed kategori awal
-- Ganti 'SUPERADMIN_USER_ID' dengan UUID user superadmin lu dari Supabase Auth
/*
INSERT INTO public.categories (name, created_by) VALUES
  ('Elektronik',        'SUPERADMIN_USER_ID'),
  ('Perkakas',          'SUPERADMIN_USER_ID'),
  ('Otomotif',          'SUPERADMIN_USER_ID'),
  ('Penerangan',        'SUPERADMIN_USER_ID'),
  ('Kesehatan',         'SUPERADMIN_USER_ID'),
  ('Home Appliance',    'SUPERADMIN_USER_ID'),
  ('Office Tools',      'SUPERADMIN_USER_ID'),
  ('Lainnya',           'SUPERADMIN_USER_ID')
ON CONFLICT (name) DO NOTHING;
*/

-- =================================================================
-- Cara pakai:
-- 1. Buka Supabase dashboard → SQL Editor
-- 2. Paste file ini (tanpa bagian comment seed jika belum ada superadmin)
-- 3. Klik Run
-- 4. Setelah ada superadmin user, uncomment bagian seed dan run lagi
-- =================================================================

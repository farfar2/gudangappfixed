# GudangApp v2 — Changelog

## Perubahan dari v1 (AI Studio Original)

### Desain
- Desain baru: light mode profesional (Odoo-style), Inter font
- Sidebar bersih dengan navigasi terstruktur per grup
- CSS custom properties untuk mudah dikustomisasi
- Tabel bersih, card minimalis, form yang readable

### Fitur Baru
- **Kategori**: master list kategori dikelola oleh admin (bukan input bebas)
- **Manajemen User**: superadmin dan admin bisa kelola role user
- **Role Superadmin**: hierarki 3 level — superadmin → admin → staff

### Security
- Role hanya bisa diubah oleh superadmin/admin melalui halaman khusus
- Staff tidak bisa mengakses menu Sistem (User & Kategori)
- RLS Supabase diperbarui: superadmin full access, admin kelola data, staff read + transaksional

### Database (jalankan `supabase/schema_additions.sql`)
- Tabel `categories` baru
- Role `superadmin` ditambahkan ke constraint

## Demo Credentials (fallback lokal)
- `superadmin@gudangapp.com` / `Super123!`
- `admin@gudangapp.com` / `Admin123!`
- `staff@gudangapp.com` / `Staff123!`

## Deploy ke Vercel
1. Push ke GitHub
2. Connect ke Vercel
3. Tambah env vars: `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

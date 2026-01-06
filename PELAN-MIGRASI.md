# PELAN MIGRASI: Supabase ke Self-Hosted (100% Ubuntu Server)

## GAMBARAN KESELURUHAN

| Item | Dari | Ke |
|------|------|-----|
| Database | Supabase PostgreSQL (cloud) | PostgreSQL (local Ubuntu) |
| Authentication | Supabase Auth | Lucia Auth (SvelteKit) |
| File Storage | Supabase Storage | Local disk + static serve |
| Hosting | Ubuntu Server | Ubuntu Server (sama) |

---

## FASA 1: PERSEDIAAN SERVER (30 minit)

### 1.1 Install PostgreSQL di Ubuntu
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.2 Setup Database & User
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE bpp_db;
CREATE USER bpp_user WITH ENCRYPTED PASSWORD 'password_selamat';
GRANT ALL PRIVILEGES ON DATABASE bpp_db TO bpp_user;
\c bpp_db
GRANT ALL ON SCHEMA public TO bpp_user;
```

### 1.3 Buat Folder Upload Gambar
```bash
mkdir -p /var/www/mamkl.my/bpp/app/static/uploads/lecturers
chmod 755 /var/www/mamkl.my/bpp/app/static/uploads/lecturers
```

---

## FASA 2: BUAT STRUKTUR DATABASE (30 minit)

### 2.1 Table: admins
```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Table: sessions (untuk auth)
```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 Table: lecturers
```sql
CREATE TABLE lecturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    gambar_url TEXT,
    keterangan TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.4 Table: lecture_sessions
```sql
CREATE TABLE lecture_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    bulan INTEGER DEFAULT 0,
    tahun INTEGER DEFAULT 0,
    minggu INTEGER NOT NULL,
    hari VARCHAR(20) NOT NULL,
    jenis_kuliah VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.5 Table: evaluations
```sql
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES lecture_sessions(id) ON DELETE SET NULL,
    lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    nama_penilai VARCHAR(255) NOT NULL,
    umur INTEGER,
    alamat TEXT,
    tarikh_penilaian DATE NOT NULL,
    q1_tajuk INTEGER NOT NULL,
    q2_ilmu INTEGER NOT NULL,
    q3_penyampaian INTEGER NOT NULL,
    q4_masa INTEGER NOT NULL,
    komen_penceramah TEXT,
    cadangan_masjid TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.6 Table: settings
```sql
CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.7 Indexes untuk performance
```sql
CREATE INDEX idx_evaluations_lecturer ON evaluations(lecturer_id);
CREATE INDEX idx_evaluations_session ON evaluations(session_id);
CREATE INDEX idx_evaluations_tarikh ON evaluations(tarikh_penilaian);
CREATE INDEX idx_sessions_lecturer ON lecture_sessions(lecturer_id);
CREATE INDEX idx_sessions_active ON lecture_sessions(is_active);
```

---

## FASA 3: MIGRATE DATA DARI SUPABASE (30 minit)

### 3.1 Export dari Supabase
- Login ke Supabase Dashboard
- Pergi ke Table Editor
- Export setiap table sebagai CSV:
  - lecturers.csv
  - lecture_sessions.csv
  - evaluations.csv
  - settings.csv
  - admins.csv (hanya email, password kena hash semula)

### 3.2 Import ke PostgreSQL Local
```bash
# Copy CSV ke server
scp *.csv ubuntu@43.134.93.81:/tmp/

# Import data
psql -U bpp_user -d bpp_db -c "\copy lecturers FROM '/tmp/lecturers.csv' CSV HEADER"
psql -U bpp_user -d bpp_db -c "\copy lecture_sessions FROM '/tmp/lecture_sessions.csv' CSV HEADER"
psql -U bpp_user -d bpp_db -c "\copy evaluations FROM '/tmp/evaluations.csv' CSV HEADER"
psql -U bpp_user -d bpp_db -c "\copy settings FROM '/tmp/settings.csv' CSV HEADER"
```

### 3.3 Download Gambar Penceramah
- Download semua gambar dari Supabase Storage
- Upload ke `/var/www/mamkl.my/bpp/app/static/uploads/lecturers/`
- Update `gambar_url` dalam database ke path local

---

## FASA 4: INSTALL DEPENDENCIES BARU (15 minit)

### 4.1 Package yang perlu ditambah
```bash
npm install postgres          # PostgreSQL client (lightweight)
npm install lucia             # Auth library untuk SvelteKit
npm install @node-rs/argon2   # Password hashing (fast & secure)
npm install @oslojs/encoding  # Encoding utilities untuk Lucia
```

### 4.2 Package yang akan dibuang
```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

---

## FASA 5: UBAH KOD - DATABASE LAYER (2 jam)

### 5.1 Fail baru: `src/lib/server/db.ts`
```typescript
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';

export const sql = postgres(DATABASE_URL);
```

### 5.2 Fail baru: `src/lib/server/queries/lecturers.ts`
- getAllLecturers()
- getLecturerById()
- createLecturer()
- updateLecturer()
- deleteLecturer()

### 5.3 Fail baru: `src/lib/server/queries/sessions.ts`
- getActiveSessions()
- getSessionsByWeek()
- createSession()
- updateSession()
- deleteSession()
- toggleSessionActive()

### 5.4 Fail baru: `src/lib/server/queries/evaluations.ts`
- getEvaluations(filters)
- getEvaluationsByLecturer()
- createEvaluation()
- deleteEvaluation()
- getEvaluationStats()

### 5.5 Fail baru: `src/lib/server/queries/settings.ts`
- getSetting(key)
- setSetting(key, value)
- getAllSettings()

---

## FASA 6: UBAH KOD - AUTHENTICATION (2 jam)

### 6.1 Fail baru: `src/lib/server/auth.ts`
```typescript
import { Lucia } from 'lucia';
import { PostgresAdapter } from '@lucia-auth/adapter-postgresql';
// Setup Lucia dengan PostgreSQL adapter
```

### 6.2 Fail baru: `src/hooks.server.ts`
```typescript
// Handle session validation pada setiap request
```

### 6.3 Ubah: `src/routes/admin/login/+page.server.ts`
- Ganti Supabase auth dengan Lucia
- Verify password dengan argon2
- Create session

### 6.4 Ubah: `src/routes/admin/+layout.server.ts`
- Check Lucia session instead of Supabase

### 6.5 Ubah: `src/routes/admin/logout/+server.ts`
- Invalidate Lucia session

### 6.6 Ubah: `src/app.d.ts`
- Update types untuk Lucia

---

## FASA 7: UBAH KOD - FILE UPLOAD (1 jam)

### 7.1 Fail baru: `src/lib/server/storage.ts`
```typescript
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function uploadFile(file: File, folder: string): Promise<string>
export async function deleteFile(filePath: string): Promise<void>
```

### 7.2 Ubah: `src/routes/admin/penceramah/+page.server.ts`
- Ganti Supabase storage dengan local storage
- Update path untuk gambar

---

## FASA 8: UBAH SEMUA PAGE SERVER FILES (2 jam)

### Fail yang perlu diubah:

| No | Fail | Perubahan |
|----|------|-----------|
| 1 | `src/routes/+page.server.ts` | Import queries, ganti supabase calls |
| 2 | `src/routes/api/evaluations/+server.ts` | Import queries, ganti supabase calls |
| 3 | `src/routes/admin/dashboard/+page.server.ts` | Import queries, ganti supabase calls |
| 4 | `src/routes/admin/jadual/+page.server.ts` | Import queries, ganti supabase calls |
| 5 | `src/routes/admin/laporan/+page.server.ts` | Import queries, ganti supabase calls |
| 6 | `src/routes/admin/komen/+page.server.ts` | Import queries, ganti supabase calls |
| 7 | `src/routes/admin/perbandingan/+page.server.ts` | Import queries, ganti supabase calls |
| 8 | `src/routes/admin/tetapan/+page.server.ts` | Import queries, ganti supabase calls |
| 9 | `src/routes/admin/penceramah/+page.server.ts` | Import queries + storage |

---

## FASA 9: CLEANUP (30 minit)

### 9.1 Buang fail Supabase
- `src/lib/supabase.ts` (DELETE)
- `src/lib/server/supabase.ts` (DELETE)

### 9.2 Update environment variables
```env
# BUANG
PUBLIC_SUPABASE_URL=xxx
PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# TAMBAH
DATABASE_URL=postgresql://bpp_user:password@localhost:5432/bpp_db
```

### 9.3 Update `.gitignore`
```
static/uploads/
```

---

## FASA 10: TESTING (1-2 jam)

### 10.1 Test Authentication
- [ ] Login dengan email/password
- [ ] Session persist selepas refresh
- [ ] Logout berfungsi
- [ ] Protected routes redirect ke login
- [ ] Invalid login shows error

### 10.2 Test Public Form
- [ ] Load senarai penceramah/sesi
- [ ] Submit penilaian berjaya
- [ ] Validation berfungsi

### 10.3 Test Admin - Dashboard
- [ ] Statistics load dengan betul
- [ ] Data refresh berfungsi

### 10.4 Test Admin - Penceramah
- [ ] List penceramah
- [ ] Tambah penceramah (dengan/tanpa gambar)
- [ ] Edit penceramah
- [ ] Delete penceramah
- [ ] Gambar upload/delete berfungsi

### 10.5 Test Admin - Jadual
- [ ] List semua sesi
- [ ] Tambah sesi baru
- [ ] Toggle active/inactive
- [ ] Delete sesi

### 10.6 Test Admin - Laporan
- [ ] Filter by date range
- [ ] Filter by lecturer
- [ ] Export CSV
- [ ] Export PDF
- [ ] Individual report

### 10.7 Test Admin - Komen
- [ ] List komen/cadangan
- [ ] Filter by date
- [ ] Delete komen

### 10.8 Test Admin - Tetapan
- [ ] Update alert threshold
- [ ] Update email settings

---

## FASA 11: DEPLOYMENT (30 minit)

### 11.1 Push ke GitHub
```bash
git add -A
git commit -m "feat: migrate from Supabase to self-hosted PostgreSQL + Lucia Auth"
git push origin server
```

### 11.2 Deploy di Server
```bash
cd /var/www/mamkl.my/bpp/app
git pull origin server
npm install
npm run build
sudo systemctl restart bpp
```

### 11.3 Verify Production
- Test semua fungsi di production
- Monitor logs untuk errors

---

## ANGGARAN MASA KESELURUHAN

| Fasa | Masa |
|------|------|
| Fasa 1: Persediaan Server | 30 minit |
| Fasa 2: Struktur Database | 30 minit |
| Fasa 3: Migrate Data | 30 minit |
| Fasa 4: Install Dependencies | 15 minit |
| Fasa 5: Database Layer | 2 jam |
| Fasa 6: Authentication | 2 jam |
| Fasa 7: File Upload | 1 jam |
| Fasa 8: Page Server Files | 2 jam |
| Fasa 9: Cleanup | 30 minit |
| Fasa 10: Testing | 1-2 jam |
| Fasa 11: Deployment | 30 minit |
| **JUMLAH** | **~10-12 jam** |

---

## RISIKO & MITIGASI

| Risiko | Mitigasi |
|--------|----------|
| Data hilang semasa migrate | Backup Supabase sebelum mula |
| Auth tidak secure | Guna Lucia (proven library) + argon2 |
| Performance drop | Add proper indexes, test queries |
| Gambar hilang | Download semua gambar sebelum migrate |
| Downtime | Buat di local dulu, test, baru deploy |

---

## BACKUP PLAN

Jika ada masalah besar:
1. Simpan kod lama dalam branch `backup-supabase`
2. Supabase masih aktif - boleh revert
3. Database Supabase masih ada datanya

---

## SELEPAS MIGRASI SELESAI

1. **Boleh cancel Supabase** (jimat kos jika ada)
2. **Setup backup PostgreSQL** - cron job untuk daily backup
3. **Monitor performance** - check slow queries
4. **Setup SSL untuk database** - jika perlu extra security

---

*Pelan ini disediakan pada 2 Januari 2026*

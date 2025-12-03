# Implementation Plan

## 1. Setup Projek dan Konfigurasi Asas

- [x] 1.1 Inisialisasi projek SvelteKit dengan TypeScript
  - Cipta projek SvelteKit baru dengan `npm create svelte@latest`
  - Pilih TypeScript, ESLint, Prettier
  - Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`
  - _Requirements: 12.4_

- [x] 1.2 Konfigurasi Supabase client
  - Cipta `src/lib/supabase.ts` untuk client-side Supabase client
  - Cipta `src/lib/server/supabase.ts` untuk server-side client
  - Setup environment variables dalam `.env`
  - _Requirements: 12.4_

- [x] 1.3 Cipta TypeScript types untuk database
  - Cipta `src/lib/types/database.ts` dengan interfaces untuk Lecturer, LectureSession, Evaluation
  - _Requirements: 5.1_

- [x] 1.4 Write property test untuk form validation
  - **Property 1: Form Validation Rejects Incomplete Submissions**
  - **Validates: Requirements 1.3**

## 2. Setup Database Supabase

- [ ] 2.1 Cipta jadual database
  - Jalankan SQL untuk cipta jadual `lecturers`, `lecture_sessions`, `evaluations`, `admins`
  - Cipta indexes untuk performance
  - _Requirements: 5.1, 7.1, 8.1_

- [ ] 2.2 Konfigurasi Row Level Security (RLS)
  - Enable RLS pada semua jadual
  - Cipta policies untuk public access (insert evaluations, read lecturers/sessions)
  - Cipta policies untuk admin access (full CRUD)
  - _Requirements: 5.4, 12.1, 12.2, 12.3_

- [ ] 2.3 Write property test untuk RLS policies
  - **Property 6: RLS Public Insert Only**
  - **Property 17: Admin Full CRUD Access**
  - **Validates: Requirements 5.4, 12.2, 12.3**

- [ ] 2.4 Setup Supabase Storage bucket untuk gambar penceramah
  - Cipta bucket `lecturer-photos` dengan public access
  - _Requirements: 7.3_

## 3. Komponen UI Asas

- [ ] 3.1 Cipta komponen UI reusable
  - `src/lib/components/ui/Button.svelte`
  - `src/lib/components/ui/Input.svelte`
  - `src/lib/components/ui/RadioGroup.svelte`
  - `src/lib/components/ui/Card.svelte`
  - `src/lib/components/ui/Select.svelte`
  - _Requirements: 13.1, 13.3_

- [ ] 3.2 Cipta root layout dengan styling
  - `src/routes/+layout.svelte` dengan global CSS
  - Mobile-first responsive design
  - Bahasa Melayu sebagai default
  - _Requirements: 13.1, 13.2_

## 4. Borang Penilaian Awam (Public Form)

- [ ] 4.1 Cipta halaman utama borang
  - `src/routes/+page.svelte` dengan banner masjid dan tajuk
  - `src/routes/+page.server.ts` untuk load data penceramah dan sesi aktif
  - _Requirements: 1.1, 1.2_

- [ ] 4.2 Cipta komponen Seksi A - Maklumat Penilai
  - `src/lib/components/form/EvaluatorInfo.svelte`
  - Fields: Nama, Umur, Alamat, Tarikh (default hari ini)
  - Form validation untuk required fields
  - _Requirements: 1.2, 1.3_

- [ ] 4.3 Cipta komponen Seksi B - Pilihan Penceramah
  - `src/lib/components/form/LecturerCard.svelte` untuk paparan kad penceramah
  - Organisasi mengikut minggu (1-5)
  - Expandable evaluation form on click
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4.4 Write property test untuk session grouping
  - **Property 2: Sessions Grouped By Week Correctly**
  - **Validates: Requirements 2.1, 8.4**

- [ ] 4.5 Write property test untuk lecturer card rendering
  - **Property 3: Lecturer Card Contains Required Information**
  - **Validates: Requirements 2.2**

- [ ] 4.6 Cipta komponen borang penilaian
  - `src/lib/components/form/EvaluationForm.svelte`
  - 4 soalan rating (skala 1-4) dengan radio buttons
  - Soalan "Cadangan untuk diteruskan?" (Ya/Tidak)
  - Petunjuk skala penilaian
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4.7 Cipta komponen Seksi C - Komen
  - `src/lib/components/form/CommentSection.svelte`
  - Textarea untuk komen penceramah (optional)
  - Textarea untuk cadangan masjid (optional)
  - _Requirements: 4.1, 4.2_

- [ ] 4.8 Implementasi submission logic
  - `src/routes/api/evaluations/+server.ts` POST endpoint
  - Validation dan sanitization
  - Save ke Supabase dengan partial evaluation support
  - Success/error message handling
  - _Requirements: 3.4, 5.1, 5.2, 5.3_

- [ ] 4.9 Write property test untuk partial evaluation submission
  - **Property 4: Partial Evaluation Submission**
  - **Validates: Requirements 3.4**

- [ ] 4.10 Write property test untuk evaluation round-trip
  - **Property 5: Evaluation Data Round-Trip**
  - **Validates: Requirements 5.1, 4.3**

## 5. Checkpoint - Pastikan semua tests pass

- [ ] 5. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## 6. Sistem Pengesahan Admin

- [ ] 6.1 Cipta halaman login admin
  - `src/routes/admin/login/+page.svelte`
  - Form email/password
  - Supabase Auth integration
  - Error handling untuk invalid credentials
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 6.2 Implementasi auth guard untuk admin routes
  - `src/routes/admin/+layout.server.ts` untuk check authentication
  - Redirect ke login jika tidak authenticated
  - `src/routes/admin/+layout.svelte` dengan sidebar navigation
  - _Requirements: 6.4, 6.5_

- [ ] 6.3 Write property test untuk admin route protection
  - **Property 7: Admin Route Protection**
  - **Validates: Requirements 6.4**

## 7. Panel Admin - Pengurusan Penceramah

- [ ] 7.1 Cipta halaman senarai penceramah
  - `src/routes/admin/penceramah/+page.svelte`
  - `src/routes/admin/penceramah/+page.server.ts`
  - Table dengan nama, gambar, sort order
  - Button tambah penceramah
  - _Requirements: 7.1_

- [ ] 7.2 Implementasi CRUD penceramah
  - Form tambah/edit penceramah
  - Upload gambar ke Supabase Storage
  - Delete dengan confirmation
  - Sort order management
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 7.3 Write property test untuk lecturer edit persistence
  - **Property 8: Lecturer Edit Persistence**
  - **Validates: Requirements 7.4**

## 8. Panel Admin - Pengurusan Jadual

- [ ] 8.1 Cipta halaman pengurusan jadual
  - `src/routes/admin/jadual/+page.svelte`
  - `src/routes/admin/jadual/+page.server.ts`
  - Month/year selector
  - Grid view mengikut minggu
  - _Requirements: 8.1, 8.4_

- [ ] 8.2 Implementasi CRUD sesi kuliah
  - Form tambah sesi: bulan, tahun, minggu, hari, jenis kuliah, penceramah
  - Toggle active/inactive
  - Delete sesi
  - _Requirements: 8.2, 8.3, 8.5_

- [ ] 8.3 Write property test untuk session creation validation
  - **Property 9: Session Creation Validation**
  - **Validates: Requirements 8.2**

- [ ] 8.4 Write property test untuk session active toggle
  - **Property 10: Session Active Toggle Visibility**
  - **Validates: Requirements 8.3**

- [ ] 8.5 Write property test untuk session deletion preserves evaluations
  - **Property 11: Session Deletion Preserves Evaluations**
  - **Validates: Requirements 8.5**

## 9. Checkpoint - Pastikan semua tests pass

- [ ] 9. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## 10. Panel Admin - Dashboard

- [ ] 10.1 Cipta halaman dashboard
  - `src/routes/admin/dashboard/+page.svelte`
  - `src/routes/admin/dashboard/+page.server.ts`
  - Jumlah penilaian bulan semasa
  - Top-rated dan lowest-rated lecturers
  - Navigation menu
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10.2 Write property test untuk lecturer ranking calculation
  - **Property 12: Lecturer Ranking Calculation**
  - **Validates: Requirements 9.2**

## 11. Panel Admin - Laporan dan Analitik

- [ ] 11.1 Setup chart library
  - Install Chart.js dan svelte-chartjs
  - Cipta wrapper components untuk client-side rendering
  - `src/lib/components/charts/BarChart.svelte`
  - `src/lib/components/charts/PieChart.svelte`
  - _Requirements: 10.3, 10.4_

- [ ] 11.2 Cipta halaman laporan
  - `src/routes/admin/laporan/+page.svelte`
  - `src/routes/admin/laporan/+page.server.ts`
  - Filter options: bulan/tahun, minggu, penceramah, jenis kuliah
  - _Requirements: 10.1_

- [ ] 11.3 Implementasi calculation functions
  - `src/lib/utils/calculations.ts`
  - Average scores per lecturer
  - Recommendation distribution (Ya/Tidak)
  - Evaluation count per lecturer
  - _Requirements: 10.2, 10.4, 10.5_

- [ ] 11.4 Write property test untuk average score calculation
  - **Property 13: Average Score Calculation**
  - **Validates: Requirements 10.2**

- [ ] 11.5 Write property test untuk recommendation distribution
  - **Property 14: Recommendation Distribution Calculation**
  - **Validates: Requirements 10.4**

- [ ] 11.6 Write property test untuk evaluation count accuracy
  - **Property 15: Evaluation Count Accuracy**
  - **Validates: Requirements 10.5**

- [ ] 11.7 Implementasi paparan laporan
  - Bar chart purata skor per penceramah
  - Pie chart Ya/Tidak distribution
  - Data table dengan evaluation records
  - _Requirements: 10.3, 10.4, 10.6_

## 12. Export Data

- [ ] 12.1 Implementasi CSV export
  - `src/lib/utils/export.ts`
  - Generate CSV dengan semua required fields
  - Download functionality
  - _Requirements: 11.1, 11.3_

- [ ] 12.2 Write property test untuk CSV export completeness
  - **Property 16: CSV Export Completeness**
  - **Validates: Requirements 11.1, 11.3**

- [ ] 12.3 Implementasi print-friendly view
  - Print stylesheet
  - Ringkasan untuk mesyuarat AJK
  - _Requirements: 11.2_

## 13. Final Checkpoint - Pastikan semua tests pass

- [x] 13. Final Checkpoint


  - Ensure all tests pass, ask the user if questions arise.

## 14. Deployment ke Cloudflare Pages

- [x] 14.1 Konfigurasi adapter Cloudflare
  - Install `@sveltejs/adapter-cloudflare`
  - Update `svelte.config.js`
  - _Requirements: Deployment_

- [ ] 14.2 Setup environment variables di Cloudflare
  - Configure PUBLIC_SUPABASE_URL
  - Configure PUBLIC_SUPABASE_ANON_KEY
  - _Requirements: 12.4_

## 15. QR Code Generator

- [x] 15.1 Implementasi QR code utility
  - Install `qrcode` library
  - Cipta `src/lib/utils/qrcode.ts` dengan fungsi generateQRCode
  - _Requirements: 14.2_

- [x] 15.2 Write property test untuk QR code round-trip
  - **Property 18: QR Code Round-Trip**
  - **Validates: Requirements 14.2**

- [x] 15.3 Cipta halaman QR code admin
  - `src/routes/admin/qrcode/+page.svelte`
  - `src/routes/admin/qrcode/+page.server.ts`
  - Display QR code dengan URL borang
  - Download button untuk PNG
  - _Requirements: 14.1, 14.3, 14.4_

## 16. Email Notifications

- [x] 16.1 Setup email service
  - Cipta `src/lib/server/email.ts` untuk email notification
  - Integrate dengan Supabase Edge Functions atau Resend API
  - _Requirements: 15.1, 15.2_

- [x] 16.2 Write property test untuk email content
  - **Property 19: Email Notification Contains Required Fields**
  - **Validates: Requirements 15.2**

- [x] 16.3 Write property test untuk email failure handling
  - **Property 20: Email Failure Does Not Block Submission**
  - **Validates: Requirements 15.3**

- [x] 16.4 Implementasi notification trigger
  - Update `src/routes/api/evaluations/+server.ts` untuk trigger email
  - Handle email failure gracefully
  - _Requirements: 15.1, 15.3_

- [x] 16.5 Cipta halaman tetapan notifikasi
  - `src/routes/admin/tetapan/+page.svelte`
  - Toggle enable/disable email notifications
  - Configure admin email addresses
  - _Requirements: 15.4_

## 17. PDF Export

- [x] 17.1 Setup PDF library
  - Install `jspdf` dan `jspdf-autotable`
  - Cipta `src/lib/utils/pdf.ts` untuk PDF generation
  - _Requirements: 16.1_

- [x] 17.2 Write property test untuk PDF content
  - **Property 21: PDF Export Contains Required Sections**
  - **Validates: Requirements 16.2**

- [x] 17.3 Implementasi PDF export di halaman laporan
  - Tambah "Export PDF" button di `src/routes/admin/laporan/+page.svelte`
  - Generate PDF dengan header masjid, statistik, dan jadual
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

## 18. Trend Chart Dashboard

- [x] 18.1 Cipta TrendChart component
  - `src/lib/components/charts/TrendChart.svelte`
  - Line chart menggunakan Chart.js
  - _Requirements: 17.1_

- [x] 18.2 Implementasi trend calculation
  - Cipta `src/lib/utils/trend.ts` untuk monthly trend calculation
  - _Requirements: 17.1, 17.2_

- [x] 18.3 Write property test untuk trend calculation
  - **Property 22: Monthly Trend Calculation**
  - **Validates: Requirements 17.1**

- [x] 18.4 Write property test untuk trend filter
  - **Property 23: Trend Filter By Lecturer**
  - **Validates: Requirements 17.2**

- [x] 18.5 Write property test untuk missing month handling
  - **Property 24: Missing Month Handling**
  - **Validates: Requirements 17.4**

- [x] 18.6 Tambah trend chart ke dashboard
  - Update `src/routes/admin/dashboard/+page.svelte`
  - Tambah filter by lecturer
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

## 19. Perbandingan Penceramah

- [x] 19.1 Cipta LecturerComparison component
  - `src/lib/components/admin/LecturerComparison.svelte`
  - Side-by-side bar charts
  - _Requirements: 18.2_

- [x] 19.2 Implementasi comparison calculation
  - Cipta `src/lib/utils/comparison.ts`
  - _Requirements: 18.2, 18.3, 18.4_

- [x] 19.3 Write property test untuk comparison scores
  - **Property 25: Lecturer Comparison Scores**
  - **Validates: Requirements 18.2**

- [x] 19.4 Write property test untuk recommendation percentage
  - **Property 26: Comparison Recommendation Percentage**
  - **Validates: Requirements 18.3**

- [x] 19.5 Cipta halaman perbandingan
  - `src/routes/admin/perbandingan/+page.svelte`
  - `src/routes/admin/perbandingan/+page.server.ts`
  - Multi-select lecturers untuk comparison
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

## 20. Alert System

- [x] 20.1 Implementasi alert logic
  - Cipta `src/lib/utils/alerts.ts`
  - Low score detection based on threshold
  - _Requirements: 19.1_

- [x] 20.2 Write property test untuk alert trigger
  - **Property 27: Low Score Alert Trigger**
  - **Validates: Requirements 19.1**

- [x] 20.3 Write property test untuk alert content
  - **Property 28: Alert Contains Required Information**
  - **Validates: Requirements 19.2**

- [x] 20.4 Write property test untuk custom threshold
  - **Property 29: Custom Alert Threshold**
  - **Validates: Requirements 19.4**

- [x] 20.5 Cipta AlertBadge component
  - `src/lib/components/admin/AlertBadge.svelte`
  - Warning indicator dengan link ke laporan
  - _Requirements: 19.2, 19.3_

- [x] 20.6 Tambah alerts ke dashboard
  - Update `src/routes/admin/dashboard/+page.svelte`
  - Display low score alerts
  - _Requirements: 19.1, 19.2, 19.3_

- [x] 20.7 Tambah threshold setting
  - Update `src/routes/admin/tetapan/+page.svelte`
  - Custom threshold configuration
  - _Requirements: 19.4_

## 21. Progress Indicator Borang

- [x] 21.1 Implementasi progress calculation
  - Cipta `src/lib/utils/progress.ts`
  - Calculate completion percentage
  - _Requirements: 20.1, 20.2_

- [x] 21.2 Write property test untuk progress calculation
  - **Property 30: Form Progress Calculation**
  - **Validates: Requirements 20.1, 20.2**

- [x] 21.3 Cipta ProgressBar component
  - `src/lib/components/ui/ProgressBar.svelte`
  - Visual progress indicator
  - _Requirements: 20.1, 20.3_

- [x] 21.4 Cipta FormProgress component
  - `src/lib/components/form/FormProgress.svelte`
  - Integrate dengan form state
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [x] 21.5 Tambah progress indicator ke borang awam
  - Update `src/routes/+page.svelte`
  - Real-time progress update
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

## 22. Save Draft Borang

- [x] 22.1 Implementasi draft storage
  - Cipta `src/lib/stores/draft.ts`
  - localStorage save/load/clear functions
  - _Requirements: 21.1, 21.2_

- [x] 22.2 Write property test untuk draft round-trip
  - **Property 31: Draft Save Round-Trip**
  - **Validates: Requirements 21.1, 21.3**

- [x] 22.3 Write property test untuk draft detection
  - **Property 32: Draft Detection**
  - **Validates: Requirements 21.2**

- [x] 22.4 Write property test untuk draft clear after submission
  - **Property 33: Draft Cleared After Submission**
  - **Validates: Requirements 21.4**

- [x] 22.5 Write property test untuk manual draft clear
  - **Property 34: Draft Manual Clear**
  - **Validates: Requirements 21.5**

- [x] 22.6 Implementasi auto-save draft
  - Update `src/routes/+page.svelte`
  - Auto-save on field change
  - _Requirements: 21.1_

- [x] 22.7 Implementasi draft restore dialog
  - Modal untuk restore atau padam draft
  - _Requirements: 21.2, 21.3_

- [x] 22.8 Implementasi clear draft on submit
  - Update submission logic
  - Clear localStorage after success
  - _Requirements: 21.4_

- [x] 22.9 Tambah "Padam Draft" button
  - Button untuk manual clear
  - _Requirements: 21.5_

## 23. Final Checkpoint - Ciri Baru

- [x] 23. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

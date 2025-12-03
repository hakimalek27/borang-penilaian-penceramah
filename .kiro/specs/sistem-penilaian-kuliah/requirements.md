# Requirements Document

## Introduction

Sistem Borang Penilaian Tenaga Pengajar Kuliah Masjid Al-Muttaqin Wangsa Melawati adalah aplikasi web yang membolehkan jemaah masjid memberikan maklum balas dan penilaian terhadap penceramah kuliah bulanan. Sistem ini dibina menggunakan SvelteKit + Supabase dan di-deploy ke Cloudflare Pages. UI sepenuhnya dalam Bahasa Melayu dan dioptimumkan untuk penggunaan telefon bimbit.

## Glossary

- **Sistem**: Aplikasi web Borang Penilaian Tenaga Pengajar Kuliah Masjid Al-Muttaqin Wangsa Melawati
- **Jemaah**: Pengguna awam yang mengisi borang penilaian tanpa perlu login
- **Admin**: Pengguna yang mempunyai akses penuh untuk mengurus penceramah, jadual, dan melihat laporan melalui Supabase Auth
- **Penceramah**: Tenaga pengajar yang menyampaikan kuliah di masjid
- **Kuliah**: Sesi pengajaran yang diadakan sama ada waktu Subuh atau Maghrib
- **Penilaian**: Maklum balas berstruktur yang diberikan oleh jemaah terhadap penceramah
- **Minggu**: Pembahagian masa dalam sebulan (Minggu 1 hingga Minggu 5)
- **Skala Penilaian**: Sistem pemarkahan 1-4 (1=Sangat Rendah, 2=Rendah, 3=Tinggi, 4=Sangat Tinggi)
- **Supabase**: Platform backend-as-a-service yang menyediakan PostgreSQL database, authentication, dan storage
- **RLS (Row Level Security)**: Polisi keselamatan pangkalan data yang mengawal akses data berdasarkan peranan pengguna
- **SvelteKit**: Framework JavaScript untuk membina aplikasi web
- **Cloudflare Pages**: Platform hosting untuk deploy aplikasi web

## Requirements

### Requirement 1: Akses Borang Penilaian Awam

**User Story:** As a jemaah, I want to access the evaluation form without logging in, so that I can quickly provide feedback on lecturers.

#### Acceptance Criteria

1. WHEN a jemaah visits the main page THEN the Sistem SHALL display the evaluation form with mosque banner and title "Borang Maklum Balas Kuliah Bulanan Masjid Al-Muttaqin Wangsa Melawati, Kuala Lumpur"
2. WHEN the form loads THEN the Sistem SHALL display Section A (Maklumat Penilai) with required fields: Nama Penilai, Umur, Alamat, and Tarikh with today's date as default
3. WHEN a jemaah attempts to submit without completing required fields THEN the Sistem SHALL prevent submission and display validation error messages in Bahasa Melayu
4. WHEN the form is accessed on a mobile device THEN the Sistem SHALL render a responsive layout optimized for touch interaction

### Requirement 2: Pemilihan Penceramah dan Minggu

**User Story:** As a jemaah, I want to select lecturers by week and view their details, so that I can evaluate the specific lecturers I attended.

#### Acceptance Criteria

1. WHEN Section B loads THEN the Sistem SHALL display lecturer cards organized by week (Minggu 1 through Minggu 5)
2. WHEN displaying a lecturer card THEN the Sistem SHALL show the lecturer's name, photo thumbnail, lecture type (Kuliah Subuh/Maghrib), and day of week
3. WHEN a jemaah clicks on a lecturer card THEN the Sistem SHALL expand an evaluation form section for that specific lecturer
4. WHEN multiple lecturer cards are clicked THEN the Sistem SHALL allow evaluation forms for multiple lecturers to be open simultaneously
5. WHEN no lecturers are scheduled for a week THEN the Sistem SHALL display a message indicating no lectures scheduled

### Requirement 3: Pengisian Borang Penilaian

**User Story:** As a jemaah, I want to rate lecturers on specific criteria using a 1-4 scale, so that I can provide structured feedback.

#### Acceptance Criteria

1. WHEN an evaluation form expands THEN the Sistem SHALL display four rating questions with radio button options (1, 2, 3, 4):
   - Penceramah mengikut tajuk yang telah ditetapkan
   - Penceramah mempunyai ilmu pengetahuan dalam tajuk yang disampaikan
   - Penyampaian penceramah jelas dan berkesan
   - Penceramah menepati jadual dan masa yang ditetapkan
2. WHEN displaying rating options THEN the Sistem SHALL show scale legend: 1=Sangat Rendah, 2=Rendah, 3=Tinggi, 4=Sangat Tinggi
3. WHEN an evaluation form expands THEN the Sistem SHALL display a "Cadangan untuk diteruskan?" question with Ya/Tidak radio options
4. WHEN a jemaah completes ratings THEN the Sistem SHALL allow submission of partial evaluations (only lecturers with completed ratings)

### Requirement 4: Komen dan Cadangan

**User Story:** As a jemaah, I want to provide optional written feedback, so that I can share detailed suggestions.

#### Acceptance Criteria

1. WHEN Section C displays THEN the Sistem SHALL show two optional textarea fields: "Komen kepada Penceramah" and "Cadangan kepada pihak Masjid"
2. WHEN a jemaah leaves comment fields empty THEN the Sistem SHALL accept the submission without requiring comments
3. WHEN a jemaah enters comments THEN the Sistem SHALL store the comments linked to the evaluation record

### Requirement 5: Penyimpanan Penilaian

**User Story:** As a jemaah, I want my evaluation to be saved securely, so that my feedback is recorded for the mosque committee.

#### Acceptance Criteria

1. WHEN a jemaah submits the form THEN the Sistem SHALL save evaluation records to Supabase database with evaluator info, lecturer reference, week, date, lecture type, ratings, and recommendation
2. WHEN submission succeeds THEN the Sistem SHALL display a success message in Bahasa Melayu and reset the form
3. IF submission fails due to network or database error THEN the Sistem SHALL display an error message and retain form data for retry
4. WHEN saving evaluation data THEN the Sistem SHALL enforce Row Level Security allowing public insert but preventing public read of all records

### Requirement 6: Pengesahan Admin

**User Story:** As an admin, I want to log in securely, so that I can access administrative functions.

#### Acceptance Criteria

1. WHEN an admin visits /admin/login THEN the Sistem SHALL display a login form with email and password fields
2. WHEN valid credentials are submitted THEN the Sistem SHALL authenticate via Supabase Auth and redirect to admin dashboard
3. IF invalid credentials are submitted THEN the Sistem SHALL display an authentication error message
4. WHEN an unauthenticated user attempts to access admin routes THEN the Sistem SHALL redirect to the login page
5. WHEN an admin clicks logout THEN the Sistem SHALL terminate the session and redirect to the login page

### Requirement 7: Pengurusan Penceramah

**User Story:** As an admin, I want to manage lecturer records, so that I can maintain an up-to-date list of lecturers.

#### Acceptance Criteria

1. WHEN an admin accesses /admin/penceramah THEN the Sistem SHALL display a list of all lecturers with name, photo, and sort order
2. WHEN an admin clicks "Tambah Penceramah" THEN the Sistem SHALL display a form with fields: name, photo upload, and optional description
3. WHEN an admin uploads a photo THEN the Sistem SHALL store the image in Supabase Storage and link it to the lecturer record
4. WHEN an admin edits a lecturer THEN the Sistem SHALL allow modification of name, photo, description, and sort order
5. WHEN an admin deletes a lecturer THEN the Sistem SHALL remove the lecturer record and associated storage files

### Requirement 8: Pengurusan Jadual Kuliah

**User Story:** As an admin, I want to schedule lectures by month, week, and day, so that jemaah can see the correct lecturers to evaluate.

#### Acceptance Criteria

1. WHEN an admin accesses /admin/jadual THEN the Sistem SHALL display a schedule management interface with month/year selector
2. WHEN an admin creates a lecture session THEN the Sistem SHALL require: month, year, week number (1-5), day of week, lecture type (Subuh/Maghrib), and lecturer selection
3. WHEN an admin toggles a session's active status THEN the Sistem SHALL update the session visibility on the public form
4. WHEN displaying the schedule THEN the Sistem SHALL organize sessions by week and show lecturer name, day, and lecture type
5. WHEN an admin deletes a session THEN the Sistem SHALL remove the session record while preserving related evaluation data

### Requirement 9: Dashboard Admin

**User Story:** As an admin, I want to see a summary dashboard, so that I can quickly understand evaluation trends.

#### Acceptance Criteria

1. WHEN an admin accesses /admin/dashboard THEN the Sistem SHALL display total evaluations for the current month
2. WHEN displaying dashboard THEN the Sistem SHALL show top-rated and lowest-rated lecturers by average score
3. WHEN displaying dashboard THEN the Sistem SHALL show navigation menu to: Tetapan Penceramah, Tetapan Jadual Kuliah, Laporan Penilaian, Export Data

### Requirement 10: Laporan dan Analitik

**User Story:** As an admin, I want to view detailed reports with charts, so that I can analyze lecturer performance.

#### Acceptance Criteria

1. WHEN an admin accesses /admin/laporan THEN the Sistem SHALL display filter options: month/year, week, lecturer, and lecture type (Subuh/Maghrib)
2. WHEN filters are applied THEN the Sistem SHALL display average scores (1-4) per lecturer for each rating question and overall
3. WHEN displaying reports THEN the Sistem SHALL show a bar chart of average scores per lecturer
4. WHEN displaying reports THEN the Sistem SHALL show a pie chart of "Cadangan untuk diteruskan" (Ya/Tidak) distribution
5. WHEN displaying reports THEN the Sistem SHALL show evaluation count per lecturer
6. WHEN displaying reports THEN the Sistem SHALL show a data table with individual evaluation records

### Requirement 11: Export Data

**User Story:** As an admin, I want to export evaluation data, so that I can share reports in committee meetings.

#### Acceptance Criteria

1. WHEN an admin clicks "Export CSV" THEN the Sistem SHALL generate a CSV file containing filtered evaluation records
2. WHEN an admin clicks "Cetak Ringkasan" THEN the Sistem SHALL display a print-friendly summary view
3. WHEN exporting data THEN the Sistem SHALL include: evaluator info, lecturer name, week, date, lecture type, all ratings, recommendation, and comments

### Requirement 12: Keselamatan Data

**User Story:** As a system administrator, I want data to be secured with proper access controls, so that evaluation data is protected.

#### Acceptance Criteria

1. WHEN the database is configured THEN the Sistem SHALL implement Row Level Security (RLS) policies on all tables
2. WHEN a public user queries the database THEN the Sistem SHALL allow only INSERT operations on evaluations table
3. WHEN an admin queries the database THEN the Sistem SHALL allow full CRUD operations on all tables
4. WHEN storing sensitive configuration THEN the Sistem SHALL use environment variables for Supabase URL and keys

### Requirement 13: Responsive Mobile UI

**User Story:** As a jemaah using a mobile phone, I want the form to be easy to use on small screens, so that I can submit evaluations conveniently.

#### Acceptance Criteria

1. WHEN the form loads on mobile THEN the Sistem SHALL display a single-column layout with touch-friendly button sizes
2. WHEN displaying lecturer cards on mobile THEN the Sistem SHALL stack cards vertically with adequate spacing
3. WHEN displaying radio buttons on mobile THEN the Sistem SHALL render them with sufficient tap target size (minimum 44x44 pixels)
4. WHEN scrolling on mobile THEN the Sistem SHALL maintain smooth scrolling performance

### Requirement 14: QR Code untuk Akses Borang

**User Story:** As an admin, I want to generate QR codes for the evaluation form, so that jemaah can scan and access the form easily from their phones.

#### Acceptance Criteria

1. WHEN an admin accesses /admin/qrcode THEN the Sistem SHALL display a QR code generator interface
2. WHEN generating a QR code THEN the Sistem SHALL encode the public form URL into a scannable QR code image
3. WHEN a QR code is generated THEN the Sistem SHALL provide download options in PNG format
4. WHEN a jemaah scans the QR code THEN the Sistem SHALL redirect to the public evaluation form

### Requirement 15: Notifikasi Email

**User Story:** As an admin, I want to receive email notifications when new evaluations are submitted, so that I can stay informed of feedback in real-time.

#### Acceptance Criteria

1. WHEN a new evaluation is submitted THEN the Sistem SHALL trigger an email notification to configured admin email addresses
2. WHEN sending notification email THEN the Sistem SHALL include summary: evaluator name, lecturer evaluated, date, and overall rating
3. IF email delivery fails THEN the Sistem SHALL log the error without affecting the evaluation submission
4. WHEN configuring notifications THEN the Sistem SHALL allow admin to enable or disable email notifications

### Requirement 16: Export PDF

**User Story:** As an admin, I want to export reports in PDF format, so that I can present professional documents in AJK meetings.

#### Acceptance Criteria

1. WHEN an admin clicks "Export PDF" THEN the Sistem SHALL generate a PDF document containing filtered evaluation reports
2. WHEN generating PDF THEN the Sistem SHALL include: report title, date range, summary statistics, charts, and detailed data table
3. WHEN generating PDF THEN the Sistem SHALL format the document with mosque header and professional layout
4. WHEN PDF generation completes THEN the Sistem SHALL trigger automatic download of the PDF file

### Requirement 17: Trend Chart Dashboard

**User Story:** As an admin, I want to see evaluation trends over time, so that I can track performance changes month by month.

#### Acceptance Criteria

1. WHEN displaying dashboard THEN the Sistem SHALL show a line chart of average evaluation scores over the past 6 months
2. WHEN displaying trend chart THEN the Sistem SHALL allow filtering by lecturer to see individual performance trends
3. WHEN displaying trend chart THEN the Sistem SHALL show data points for each month with hover tooltips showing exact values
4. WHEN no data exists for a month THEN the Sistem SHALL display the gap appropriately without breaking the chart

### Requirement 18: Perbandingan Penceramah

**User Story:** As an admin, I want to compare lecturer performance side-by-side, so that I can make informed decisions about scheduling.

#### Acceptance Criteria

1. WHEN an admin accesses comparison view THEN the Sistem SHALL allow selection of two or more lecturers for comparison
2. WHEN comparing lecturers THEN the Sistem SHALL display side-by-side bar charts of average scores per rating question
3. WHEN comparing lecturers THEN the Sistem SHALL show recommendation percentage (Ya/Tidak) for each lecturer
4. WHEN comparing lecturers THEN the Sistem SHALL display total evaluation count for each lecturer

### Requirement 19: Alert System untuk Skor Rendah

**User Story:** As an admin, I want to be alerted when a lecturer receives low scores, so that I can take appropriate action.

#### Acceptance Criteria

1. WHEN a lecturer's average score falls below 2.0 THEN the Sistem SHALL display a warning indicator on the dashboard
2. WHEN displaying alerts THEN the Sistem SHALL show lecturer name, current average score, and number of evaluations
3. WHEN an admin views alerts THEN the Sistem SHALL provide link to detailed report for the flagged lecturer
4. WHEN configuring alerts THEN the Sistem SHALL allow admin to set custom threshold for low score alerts

### Requirement 20: Progress Indicator Borang

**User Story:** As a jemaah, I want to see my form completion progress, so that I know how much more I need to fill.

#### Acceptance Criteria

1. WHEN filling the form THEN the Sistem SHALL display a progress bar showing percentage of completion
2. WHEN calculating progress THEN the Sistem SHALL consider: evaluator info fields, lecturer selections, and ratings completed
3. WHEN progress reaches 100% THEN the Sistem SHALL visually indicate the form is ready for submission
4. WHEN progress changes THEN the Sistem SHALL update the progress bar in real-time without page refresh

### Requirement 21: Save Draft Borang

**User Story:** As a jemaah, I want to save my form progress locally, so that I don't lose my work if I accidentally close the browser.

#### Acceptance Criteria

1. WHEN a jemaah enters data in the form THEN the Sistem SHALL automatically save draft to browser localStorage
2. WHEN a jemaah returns to the form THEN the Sistem SHALL detect existing draft and offer to restore it
3. WHEN restoring draft THEN the Sistem SHALL populate all previously entered fields including evaluator info and ratings
4. WHEN form is successfully submitted THEN the Sistem SHALL clear the saved draft from localStorage
5. WHEN a jemaah clicks "Padam Draft" THEN the Sistem SHALL remove saved draft and reset the form

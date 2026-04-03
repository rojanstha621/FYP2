PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

-- Bulk seed for SQLite
-- Creates:
-- 1 admin
-- 10 approved therapists
-- 30 patients
-- profiles for therapists/patients
-- therapist-patient assignments
-- patient medical histories
-- 10 videos + 30 video assignments

-- Password hashes (Django compatible)
-- Admin@123
-- Therapist@123
-- Patient@123

INSERT OR IGNORE INTO account_user (
  id, password, last_login, date_joined, email, first_name, last_name, phone_number,
  role, created_at, updated_at, is_staff, is_active, is_superuser,
  is_therapist_approved, therapist_status, therapist_verified_at
) VALUES (
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'pbkdf2_sha256$1200000$0UNUXOTupQkBqDpsLSwKi8$66n9swelXwl7i5zd8uYqA0KO/BudKFJUH/Z+fHg9rcw=',
  NULL,
  '2026-03-26 09:00:00',
  'admin.bulk@example.com',
  'Bulk',
  'Admin',
  '9800000100',
  'ADMIN',
  '2026-03-26 09:00:00',
  '2026-03-26 09:00:00',
  1,
  1,
  1,
  0,
  NULL,
  NULL
);

-- 10 therapists
WITH RECURSIVE t(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM t WHERE n < 10
)
INSERT OR IGNORE INTO account_user (
  id, password, last_login, date_joined, email, first_name, last_name, phone_number,
  role, created_at, updated_at, is_staff, is_active, is_superuser,
  is_therapist_approved, therapist_status, therapist_verified_at
)
SELECT
  printf('%032x', 1000 + n) AS id,
  'pbkdf2_sha256$1200000$biFVBixHHnkPE9ykvBcHCq$WDTidR4d+xnqC/8pbeCRbPIugukSLFkRWlnzJApzB5s=' AS password,
  NULL AS last_login,
  datetime('2026-03-26 09:10:00', printf('+%d minutes', n)) AS date_joined,
  printf('therapist%02d.bulk@example.com', n) AS email,
  printf('Therapist%02d', n) AS first_name,
  'User' AS last_name,
  printf('980100%04d', n) AS phone_number,
  'THERAPIST' AS role,
  datetime('2026-03-26 09:10:00', printf('+%d minutes', n)) AS created_at,
  datetime('2026-03-26 09:10:00', printf('+%d minutes', n)) AS updated_at,
  0 AS is_staff,
  1 AS is_active,
  0 AS is_superuser,
  1 AS is_therapist_approved,
  'APPROVED' AS therapist_status,
  datetime('2026-03-26 09:10:00', printf('+%d minutes', n)) AS therapist_verified_at
FROM t;

-- 30 patients
WITH RECURSIVE p(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM p WHERE n < 30
)
INSERT OR IGNORE INTO account_user (
  id, password, last_login, date_joined, email, first_name, last_name, phone_number,
  role, created_at, updated_at, is_staff, is_active, is_superuser,
  is_therapist_approved, therapist_status, therapist_verified_at
)
SELECT
  printf('%032x', 2000 + n) AS id,
  'pbkdf2_sha256$1200000$5143nmk8rWm2sCNE4cNKCU$a1e4rdtA982gxFaveDPKXPbNjT4DpeZWb+VjEHNbTFE=' AS password,
  NULL AS last_login,
  datetime('2026-03-26 10:00:00', printf('+%d minutes', n)) AS date_joined,
  printf('patient%02d.bulk@example.com', n) AS email,
  printf('Patient%02d', n) AS first_name,
  'User' AS last_name,
  printf('980200%04d', n) AS phone_number,
  'PATIENT' AS role,
  datetime('2026-03-26 10:00:00', printf('+%d minutes', n)) AS created_at,
  datetime('2026-03-26 10:00:00', printf('+%d minutes', n)) AS updated_at,
  0 AS is_staff,
  1 AS is_active,
  0 AS is_superuser,
  0 AS is_therapist_approved,
  NULL AS therapist_status,
  NULL AS therapist_verified_at
FROM p;

-- Profiles for 10 therapists
WITH RECURSIVE t(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM t WHERE n < 10
)
INSERT OR IGNORE INTO account_userprofile (
  user_id, profile_picture, address, bio, updated_at, created_at
)
SELECT
  printf('%032x', 1000 + n),
  NULL,
  printf('City %02d', n),
  'Approved therapist profile (bulk seed).',
  datetime('2026-03-26 11:00:00', printf('+%d minutes', n)),
  datetime('2026-03-26 11:00:00', printf('+%d minutes', n))
FROM t;

-- Profiles for 30 patients
WITH RECURSIVE p(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM p WHERE n < 30
)
INSERT OR IGNORE INTO account_userprofile (
  user_id, profile_picture, address, bio, updated_at, created_at
)
SELECT
  printf('%032x', 2000 + n),
  NULL,
  printf('District %02d', n),
  'Patient profile (bulk seed).',
  datetime('2026-03-26 11:20:00', printf('+%d minutes', n)),
  datetime('2026-03-26 11:20:00', printf('+%d minutes', n))
FROM p;

-- Assign each patient to therapist ((patient-1) % 10) + 1
WITH RECURSIVE p(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM p WHERE n < 30
)
INSERT OR IGNORE INTO medicals_therapistpatientassignment (
  therapist_id, patient_id, assigned_at, is_active
)
SELECT
  printf('%032x', 1000 + (((n - 1) % 10) + 1)) AS therapist_id,
  printf('%032x', 2000 + n) AS patient_id,
  datetime('2026-03-26 12:00:00', printf('+%d minutes', n)) AS assigned_at,
  1 AS is_active
FROM p;

-- Medical history for each patient
WITH RECURSIVE p(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM p WHERE n < 30
)
INSERT OR IGNORE INTO medicals_medicalhistory (
  patient_id, past_injuries, chronic_conditions, surgeries, medications,
  allergies, current_symptoms, medical_report, created_at, updated_at
)
SELECT
  printf('%032x', 2000 + n) AS patient_id,
  printf('Minor sprain %02d', n) AS past_injuries,
  'None' AS chronic_conditions,
  'None' AS surgeries,
  'None' AS medications,
  'Dust' AS allergies,
  'Mild pain during movement' AS current_symptoms,
  NULL AS medical_report,
  datetime('2026-03-26 12:30:00', printf('+%d minutes', n)) AS created_at,
  datetime('2026-03-26 12:30:00', printf('+%d minutes', n)) AS updated_at
FROM p;

-- 10 videos created by admin
WITH RECURSIVE v(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM v WHERE n < 10
)
INSERT OR IGNORE INTO videos_video (
  id, title, description, youtube_url, youtube_embed_url, thumbnail_url,
  is_active, created_at, updated_at, created_by_id
)
SELECT
  8100 + n AS id,
  printf('Education Video %02d', n) AS title,
  'Patient education content.' AS description,
  'https://www.youtube.com/watch?v=aqz-KE-bpKQ' AS youtube_url,
  'https://www.youtube.com/embed/aqz-KE-bpKQ' AS youtube_embed_url,
  'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg' AS thumbnail_url,
  1 AS is_active,
  datetime('2026-03-26 15:00:00', printf('+%d minutes', n)) AS created_at,
  datetime('2026-03-26 15:00:00', printf('+%d minutes', n)) AS updated_at,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' AS created_by_id
FROM v;

-- 30 video assignments: each patient gets the therapist-mapped video
WITH RECURSIVE p(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM p WHERE n < 30
)
INSERT OR IGNORE INTO videos_videoassignment (
  video_id, therapist_id, patient_id, notes,
  assigned_at, is_active, viewed, viewed_at
)
SELECT
  8100 + (((n - 1) % 10) + 1) AS video_id,
  printf('%032x', 1000 + (((n - 1) % 10) + 1)) AS therapist_id,
  printf('%032x', 2000 + n) AS patient_id,
  'Please watch before next appointment.' AS notes,
  datetime('2026-03-26 16:00:00', printf('+%d minutes', n)) AS assigned_at,
  1 AS is_active,
  0 AS viewed,
  NULL AS viewed_at
FROM p;

COMMIT;

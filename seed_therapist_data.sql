PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

-- 1) Users (admin, therapist, patient)
-- IDs are 32-char UUID hex strings (matches account_user.id char(32)).
INSERT OR IGNORE INTO account_user (
  id, password, last_login, date_joined, email, first_name, last_name, phone_number,
  role, created_at, updated_at, is_staff, is_active, is_superuser,
  is_therapist_approved, therapist_status, therapist_verified_at
) VALUES (
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'pbkdf2_sha256$1200000$0UNUXOTupQkBqDpsLSwKi8$66n9swelXwl7i5zd8uYqA0KO/BudKFJUH/Z+fHg9rcw=',
  NULL,
  '2026-03-26 10:00:00',
  'admin.seed@example.com',
  'System',
  'Admin',
  '9800000001',
  'ADMIN',
  '2026-03-26 10:00:00',
  '2026-03-26 10:00:00',
  1,
  1,
  1,
  0,
  NULL,
  NULL
);

INSERT OR IGNORE INTO account_user (
  id, password, last_login, date_joined, email, first_name, last_name, phone_number,
  role, created_at, updated_at, is_staff, is_active, is_superuser,
  is_therapist_approved, therapist_status, therapist_verified_at
) VALUES (
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'pbkdf2_sha256$1200000$biFVBixHHnkPE9ykvBcHCq$WDTidR4d+xnqC/8pbeCRbPIugukSLFkRWlnzJApzB5s=',
  NULL,
  '2026-03-26 10:01:00',
  'therapist.seed@example.com',
  'Rita',
  'Therapist',
  '9800000002',
  'THERAPIST',
  '2026-03-26 10:01:00',
  '2026-03-26 10:01:00',
  0,
  1,
  0,
  1,
  'APPROVED',
  '2026-03-26 10:01:00'
);

INSERT OR IGNORE INTO account_user (
  id, password, last_login, date_joined, email, first_name, last_name, phone_number,
  role, created_at, updated_at, is_staff, is_active, is_superuser,
  is_therapist_approved, therapist_status, therapist_verified_at
) VALUES (
  'cccccccccccccccccccccccccccccccc',
  'pbkdf2_sha256$1200000$5143nmk8rWm2sCNE4cNKCU$a1e4rdtA982gxFaveDPKXPbNjT4DpeZWb+VjEHNbTFE=',
  NULL,
  '2026-03-26 10:02:00',
  'patient.seed@example.com',
  'Pawan',
  'Patient',
  '9800000003',
  'PATIENT',
  '2026-03-26 10:02:00',
  '2026-03-26 10:02:00',
  0,
  1,
  0,
  0,
  NULL,
  NULL
);

-- 2) Profiles
INSERT OR IGNORE INTO account_userprofile (
  user_id, profile_picture, address, bio, updated_at, created_at
) VALUES (
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  NULL,
  'Kathmandu',
  'Licensed therapist focused on rehabilitation.',
  '2026-03-26 10:05:00',
  '2026-03-26 10:05:00'
);

INSERT OR IGNORE INTO account_userprofile (
  user_id, profile_picture, address, bio, updated_at, created_at
) VALUES (
  'cccccccccccccccccccccccccccccccc',
  NULL,
  'Pokhara',
  'Recovering patient following daily plan.',
  '2026-03-26 10:06:00',
  '2026-03-26 10:06:00'
);

-- 3) Therapist-Patient assignment
INSERT OR IGNORE INTO medicals_therapistpatientassignment (
  therapist_id, patient_id, assigned_at, is_active
) VALUES (
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'cccccccccccccccccccccccccccccccc',
  '2026-03-26 10:10:00',
  1
);

-- 4) Patient medical history
INSERT OR IGNORE INTO medicals_medicalhistory (
  patient_id, past_injuries, chronic_conditions, surgeries, medications,
  allergies, current_symptoms, medical_report, created_at, updated_at
) VALUES (
  'cccccccccccccccccccccccccccccccc',
  'Ankle sprain (2024)',
  'None',
  'None',
  'None',
  'Dust',
  'Mild lower back pain',
  NULL,
  '2026-03-26 10:12:00',
  '2026-03-26 10:12:00'
);

-- 5) Admin-managed educational video
INSERT OR IGNORE INTO videos_video (
  id, title, description, youtube_url, youtube_embed_url, thumbnail_url,
  is_active, created_at, updated_at, created_by_id
) VALUES (
  8001,
  'Posture Basics',
  'Basic posture and movement education.',
  'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  'https://www.youtube.com/embed/aqz-KE-bpKQ',
  'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
  1,
  '2026-03-26 10:20:00',
  '2026-03-26 10:20:00',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
);

-- 6) Therapist assigns video to patient
INSERT OR IGNORE INTO videos_videoassignment (
  video_id, therapist_id, patient_id, notes,
  assigned_at, is_active, viewed, viewed_at
) VALUES (
  8001,
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  'cccccccccccccccccccccccccccccccc',
  'Watch this before next therapy session.',
  '2026-03-26 10:25:00',
  1,
  0,
  NULL
);

COMMIT;

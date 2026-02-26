# Video Management Module

A complete Django REST Framework module for managing educational videos and assignments in a Therapist Management System.

## Overview

This module allows:
- **Admins** to manage a library of YouTube educational videos
- **Therapists** to assign videos to their patients
- **Patients** to view videos assigned to them by their therapist

## Features

### 🎬 Video Management
- Store YouTube videos with auto-generated embed URLs and thumbnails
- Active/Inactive status control
- Admin-only CRUD operations
- Automatic YouTube URL parsing (supports multiple formats)

### 📋 Video Assignments
- Therapists can assign videos to their patients
- Validation ensures therapists can only assign to their own patients
- Duplicate assignment prevention
- Soft delete (deactivation) instead of hard delete
- Patient viewing tracking

### 🔐 Role-Based Permissions
- **Admin**: Full CRUD on videos
- **Therapist**: View active videos, assign to patients, manage their assignments
- **Patient**: View only assigned videos, mark as viewed

## Models

### Video
```python
- title (CharField)
- description (TextField)
- youtube_url (URLField)
- youtube_embed_url (URLField) - auto-generated
- thumbnail_url (URLField) - auto-generated
- is_active (BooleanField)
- created_by (ForeignKey to User)
- created_at, updated_at
```

### VideoAssignment
```python
- video (ForeignKey to Video)
- therapist (ForeignKey to User)
- patient (ForeignKey to User)
- notes (TextField)
- assigned_at (DateTimeField)
- is_active (BooleanField)
- viewed (BooleanField)
- viewed_at (DateTimeField)
```

**Constraints:**
- Unique together: (video, patient, therapist)
- Therapist must be assigned to patient (validated via TherapistPatientAssignment)
- Only active videos can be assigned

## API Endpoints

### Admin Endpoints
```
GET     /api/videos/videos/                    - List all videos
POST    /api/videos/videos/                    - Create new video
GET     /api/videos/videos/{id}/               - Get video details
PUT     /api/videos/videos/{id}/               - Update video
DELETE  /api/videos/videos/{id}/               - Delete video
POST    /api/videos/videos/{id}/toggle_active/ - Toggle active status
```

### Therapist Endpoints
```
GET     /api/videos/active-videos/                        - List active videos
GET     /api/videos/active-videos/{id}/                   - Get video details
POST    /api/videos/assignments/                          - Assign video to patient
GET     /api/videos/assignments/                          - List my assignments
GET     /api/videos/assignments/{id}/                     - Get assignment details
PATCH   /api/videos/assignments/{id}/                     - Update assignment notes
DELETE  /api/videos/assignments/{id}/                     - Unassign video (soft delete)
GET     /api/videos/assignments/my_assignments/           - Get all my assignments
GET     /api/videos/assignments/by_patient/               - Get assignments grouped by patient
```

### Patient Endpoints
```
GET     /api/videos/my-videos/                  - List assigned videos
GET     /api/videos/my-videos/{id}/             - Get video details
POST    /api/videos/my-videos/{id}/mark_viewed/ - Mark video as viewed
GET     /api/videos/my-videos/statistics/       - Get viewing statistics
```

## YouTube URL Support

The module automatically extracts video IDs from various YouTube URL formats:

```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
```

And converts them to:
- Embed URL: `https://www.youtube.com/embed/VIDEO_ID`
- Thumbnail: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`

## Usage Examples

### Admin: Create a Video
```bash
POST /api/videos/videos/
{
  "title": "Lower Back Stretching Tutorial",
  "description": "Learn proper techniques for lower back stretches",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "is_active": true
}
```

### Therapist: Assign Video to Patient
```bash
POST /api/videos/assignments/
{
  "video": "video-uuid",
  "patient": "patient-uuid",
  "notes": "Please watch this before our next session"
}
```

### Patient: Mark Video as Viewed
```bash
POST /api/videos/my-videos/{assignment-id}/mark_viewed/
```

## Validation Rules

1. **Video Assignment**:
   - Only active videos can be assigned
   - Therapist must be assigned to the patient
   - No duplicate assignments (same video to same patient by same therapist)

2. **YouTube URLs**:
   - Must be valid YouTube video URLs
   - Automatically parsed and converted to embed format

3. **Permissions**:
   - Admins: Must have role="ADMIN"
   - Therapists: Must have role="THERAPIST" and is_approved_therapist=True
   - Patients: Must have role="PATIENT"

## Testing

Run the test suite:
```bash
python manage.py test videos
```

Tests cover:
- Video creation and URL parsing
- Admin permissions
- Therapist video browsing and assignment
- Assignment validation (duplicates, inactive videos, unassigned patients)
- Patient video viewing and tracking

## Database Indexes

Optimized with indexes on:
- `Video.is_active`
- `Video.created_at`
- `VideoAssignment (therapist, is_active)`
- `VideoAssignment (patient, is_active)`
- `VideoAssignment.assigned_at`

## Admin Interface

Both models are registered in Django Admin with:
- List displays with key information
- Search functionality
- Filters by status and dates
- Read-only fields for auto-generated data
- Optimized querysets with select_related

## Integration with Existing System

This module integrates seamlessly with:
- **account.User** model for role-based permissions
- **medicals.TherapistPatientAssignment** for validating therapist-patient relationships
- Follows the same patterns as the existing `exercises` app

## Future Enhancements

Potential improvements:
- Video watch time tracking
- Video completion percentage
- Video categories/tags
- Playlists
- Video recommendations
- Patient feedback/ratings
- Multiple therapist assignments (if needed)

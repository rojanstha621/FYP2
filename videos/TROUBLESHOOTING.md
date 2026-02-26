# Video Management Module - Troubleshooting Guide

## Common Issues and Solutions

### 1. 403 Forbidden Error for Therapists

**Error:** `GET http://localhost:8000/api/videos/active-videos/ [HTTP/1.1 403 Forbidden]`

**Cause:** Therapist user is not approved in the system.

**Solution:**
```bash
# Run this command to approve all therapists
python manage.py approve_therapists
```

**Manual Fix:**
```python
# In Django shell
python manage.py shell

from account.models import User

# Find your therapist
therapist = User.objects.get(email='your_therapist_email@example.com')

# Approve them
therapist.therapist_status = 'APPROVED'
therapist.is_therapist_approved = True
therapist.save()
```

### 2. TypeError: response.data.filter is not a function

**Error:** Frontend shows error about `.filter()` not being a function

**Cause:** API response structure mismatch

**Solution:** This has been fixed in the latest frontend code. The code now handles multiple response formats:
- Direct array: `response.data`
- Paginated: `response.data.results`
- Wrapped: `response.data.data`

If you still see this error, make sure your frontend code is up to date.

### 3. Videos Not Showing for Therapist

**Checklist:**
1. ✅ Therapist is approved (run `approve_therapists` command)
2. ✅ At least one video exists and is active
3. ✅ Backend server is running
4. ✅ Frontend is pointing to correct API URL

**Create Test Data:**
```bash
python manage.py shell

from account.models import User
from videos.models import Video

# Create a test video as admin
admin = User.objects.filter(role='ADMIN').first()
video = Video.objects.create(
    title="Test Exercise Video",
    description="This is a test video",
    youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    is_active=True,
    created_by=admin
)
print(f"Created video: {video.title}")
```

### 4. Cannot Assign Video to Patient

**Error:** "You are not assigned to this patient"

**Cause:** No active TherapistPatientAssignment exists

**Solution:**
```python
python manage.py shell

from account.models import User
from medicals.models import TherapistPatientAssignment

therapist = User.objects.get(email='therapist@example.com')
patient = User.objects.get(email='patient@example.com')

# Create assignment
assignment = TherapistPatientAssignment.objects.create(
    therapist=therapist,
    patient=patient,
    is_active=True
)
print(f"Created assignment: {assignment}")
```

### 5. React Router Warning

**Warning:** `v7_relativeSplatPath` future flag warning

**Solution:** This is just a warning for React Router v7 migration. It doesn't affect functionality. To fix:

In your router configuration, add:
```javascript
<BrowserRouter future={{ v7_relativeSplatPath: true }}>
  {/* your routes */}
</BrowserRouter>
```

## Quick Setup for Development

### 1. Ensure Database is Migrated
```bash
python manage.py migrate
```

### 2. Create Test Users
```bash
python manage.py shell

from account.models import User

# Create admin
admin = User.objects.create_user(
    email='admin@test.com',
    password='admin123',
    first_name='Admin',
    role='ADMIN',
    is_staff=True
)

# Create therapist
therapist = User.objects.create_user(
    email='therapist@test.com',
    password='therapist123',
    first_name='Therapist',
    role='THERAPIST',
    therapist_status='APPROVED',
    is_therapist_approved=True
)

# Create patient
patient = User.objects.create_user(
    email='patient@test.com',
    password='patient123',
    first_name='Patient',
    role='PATIENT'
)
```

### 3. Create Therapist-Patient Assignment
```bash
python manage.py shell

from account.models import User
from medicals.models import TherapistPatientAssignment

therapist = User.objects.get(email='therapist@test.com')
patient = User.objects.get(email='patient@test.com')

TherapistPatientAssignment.objects.create(
    therapist=therapist,
    patient=patient,
    is_active=True
)
```

### 4. Create Test Video
```bash
python manage.py shell

from account.models import User
from videos.models import Video

admin = User.objects.get(email='admin@test.com')

Video.objects.create(
    title="Physical Therapy Basics",
    description="Introduction to physical therapy exercises",
    youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    is_active=True,
    created_by=admin
)
```

### 5. Test the Setup
```bash
# Run backend
python manage.py runserver

# In another terminal, run frontend
cd frontend
npm run dev
```

Then login as:
- **Admin:** admin@test.com / admin123
- **Therapist:** therapist@test.com / therapist123
- **Patient:** patient@test.com / patient123

## Testing Workflow

### As Admin
1. Login → Navigate to "Videos"
2. Click "Add Video"
3. Enter YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Fill in title and description
5. Click "Create"

### As Therapist
1. Login → Navigate to "Videos"
2. Browse active videos
3. Click "Assign" on a video
4. Select patient
5. Add notes (optional)
6. Submit

### As Patient
1. Login → Navigate to "Videos"
2. See assigned videos
3. Click "Watch Video"
4. Video automatically marked as viewed

## API Endpoints Reference

### Admin
- `GET /api/videos/videos/` - List all videos
- `POST /api/videos/videos/` - Create video
- `PATCH /api/videos/videos/{id}/` - Update video
- `DELETE /api/videos/videos/{id}/` - Delete video
- `POST /api/videos/videos/{id}/toggle_active/` - Toggle status

### Therapist
- `GET /api/videos/active-videos/` - List active videos
- `GET /api/videos/assignments/` - List assignments
- `POST /api/videos/assignments/` - Assign video
- `DELETE /api/videos/assignments/{id}/` - Unassign

### Patient
- `GET /api/videos/my-videos/` - List assigned videos
- `POST /api/videos/my-videos/{id}/mark_viewed/` - Mark viewed
- `GET /api/videos/my-videos/statistics/` - Get statistics

## Need Help?

If you're still experiencing issues:

1. Check Django logs for errors
2. Check browser console for JavaScript errors
3. Verify all migrations are applied: `python manage.py showmigrations`
4. Run tests: `python manage.py test videos`
5. Check user permissions in Django admin panel

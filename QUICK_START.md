# FYP2 - Quick Start Guide

## Prerequisites
- Python 3.13+
- Node.js 16+
- npm or yarn

---

## Backend Setup

### 1. Navigate to project directory
```bash
cd d:\Assignments_Not_Mine\paru\FYP2
```

### 2. Activate virtual environment
```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Windows CMD
.\.venv\Scripts\activate.bat
```

### 3. Install dependencies (if not already installed)
```bash
pip install -r requirements.txt
```

**Important:** If you get `ModuleNotFoundError: No module named 'django_filters'`, copy it manually:
```powershell
python -c "import sys; sys.path.insert(0, r'C:\Users\user\AppData\Roaming\Python\Python313\site-packages'); import shutil; shutil.copytree(r'C:\Users\user\AppData\Roaming\Python\Python313\site-packages\django_filters', r'd:\Assignments_Not_Mine\paru\FYP2\.venv\Lib\site-packages\django_filters')"
```

### 4. Run migrations (if not already done)
```bash
python manage.py migrate
```

### 5. Create superuser (admin account)
```bash
python manage.py createsuperuser
```

### 6. Run development server
```bash
python manage.py runserver
```

Backend will be available at: **http://localhost:8000**

- API Documentation: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- ReDoc: http://localhost:8000/api/docs/redoc/

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## Testing the Application

### 1. Create Test Accounts

#### Option A: Using Django Admin
1. Go to http://localhost:8000/admin
2. Login with superuser credentials
3. Add users with different roles (ADMIN, THERAPIST, PATIENT)

#### Option B: Using Registration Page
1. Go to http://localhost:5173/register
2. Register users with email and password
3. Use admin panel to assign roles

### 2. Test Features

#### User Management:
1. Login at http://localhost:5173/login
2. View profile at http://localhost:5173/profile
3. Test change password
4. Admin: Manage users at http://localhost:5173/admin/users

#### Medical History:
1. Login as patient
2. Go to http://localhost:5173/medical-history
3. Create/update/delete your medical history
4. Login as therapist
5. View assigned patients' medical histories

#### Assignments:
1. Login as therapist or admin
2. Go to http://localhost:5173/assignments
3. Assign therapist to patient
4. Login as patient to see assigned therapists

#### Exercise Library:
1. Login as therapist or admin
2. Go to http://localhost:5173/exercises
3. Create new exercise:
   - Upload video file OR provide YouTube URL
   - Add thumbnail, instructions, safety notes
4. Test search and filters
5. Login as patient to view exercises (read-only)

---

## API Endpoints Reference

### Base URL: `http://localhost:8000`

### Authentication
```
POST   /api/account/register/
POST   /api/account/login/
POST   /api/account/logout/
POST   /api/account/token/refresh/
GET    /api/account/me/
PATCH  /api/account/me/
POST   /api/account/change-password/
```

### Admin
```
GET    /api/account/users/
GET    /api/account/users/{id}/
PATCH  /api/account/users/{id}/
DELETE /api/account/users/{id}/
```

### Medical Histories
```
GET    /api/medicals/medical-history/
POST   /api/medicals/medical-history/
GET    /api/medicals/medical-history/{id}/
PATCH  /api/medicals/medical-history/{id}/
DELETE /api/medicals/medical-history/{id}/
```

### Assignments
```
GET    /api/medicals/assignments/
POST   /api/medicals/assignments/
GET    /api/medicals/assignments/{id}/
PATCH  /api/medicals/assignments/{id}/
DELETE /api/medicals/assignments/{id}/
GET    /api/medicals/my-patients/
GET    /api/medicals/my-therapists/
```

### Exercises
```
GET    /api/exercises/exercises/
POST   /api/exercises/exercises/
GET    /api/exercises/exercises/{id}/
PATCH  /api/exercises/exercises/{id}/
DELETE /api/exercises/exercises/{id}/
```

---

## Sample Data for Testing

### Create Sample Exercise (using Postman or curl):

```bash
curl -X POST http://localhost:8000/api/exercises/exercises/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "name=Shoulder Rotation" \
  -F "description=Gentle shoulder rotation exercise for mobility" \
  -F "target_area=Shoulder" \
  -F "difficulty=EASY" \
  -F "youtube_url=https://www.youtube.com/watch?v=example" \
  -F "instructions=1. Stand upright\n2. Rotate shoulders slowly\n3. Repeat 10 times" \
  -F "safety_notes=Stop if you feel pain"
```

---

## Troubleshooting

### Backend Issues:

#### Problem: `ModuleNotFoundError: No module named 'django_filters'`
**Solution:** The package is installed globally but not in venv. Copy it manually (see Backend Setup step 3).

#### Problem: `No changes detected in app 'exercises'`
**Solution:** Migrations already exist. Run `python manage.py migrate` instead.

#### Problem: CORS errors
**Solution:** Check that `corsheaders` is in INSTALLED_APPS and middleware is configured.

### Frontend Issues:

#### Problem: Can't connect to backend
**Solution:** 
- Check backend is running on port 8000
- Check VITE_API_URL in frontend/.env (if exists)
- Default is http://localhost:8000

#### Problem: 401 Unauthorized on all requests
**Solution:**
- Check if you're logged in
- Check if access token is in localStorage
- Token may have expired - try logging in again

---

## Development Tips

### Backend:
- Use Django shell for quick testing: `python manage.py shell`
- View all routes: Create a management command or check urls.py
- Check logs in terminal for debugging

### Frontend:
- React DevTools extension helpful for debugging
- Check browser console for errors
- Network tab shows API requests/responses

### Database:
- View database: Use DB Browser for SQLite
- Reset database: Delete db.sqlite3 and run migrations again
- Backup before major changes

---

## File Upload Testing

### Video Files:
- Supported formats: mp4, webm, ogg
- Max size: Check Django settings (default 2.5MB)
- Upload location: `media/exercises/videos/`

### Image Files:
- Supported formats: jpg, jpeg, png, gif
- Max size: Check Django settings
- Upload location: `media/exercises/thumbnails/` or `media/profiles/`

### YouTube URLs:
- Format: `https://www.youtube.com/watch?v=VIDEO_ID`
- Will be converted to embed URL automatically

---

## Common Commands

### Backend:
```bash
# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver

# Django shell
python manage.py shell
```

### Frontend:
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Next Steps

1. ✅ Test all features thoroughly
2. ✅ Create sample data for demonstration
3. [ ] Write unit tests
4. [ ] Write integration tests
5. [ ] Prepare for deployment
6. [ ] Set up production environment
7. [ ] Configure environment variables
8. [ ] Set up CI/CD pipeline

---

## Support

For issues or questions:
1. Check IMPLEMENTATION_SUMMARY.md for feature details
2. Review API documentation at http://localhost:8000
3. Check Django logs in terminal
4. Check browser console for frontend errors

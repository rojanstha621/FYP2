# Physical Therapy Management System - Frontend

A modern React-based frontend for the Physical Therapy Management System, built with **React 18**, **JavaScript**, and **Tailwind CSS v3**.

## Features

### [🔐] Authentication
- User registration (Patient, Therapist)
- JWT-based login and logout
- Automatic token refresh
- Protected routes with role-based access control

### [👤] For Patients
- **Medical History Management**: Store and manage comprehensive medical records
- **Exercise Routines**: Follow assigned exercises with instructional videos
- **Progress Tracking**: Monitor pain levels, difficulty ratings, and rehabilitation progress
- **Session Guidance**: Real-time exercise guidance with timers

### [🏥] For Therapists
- **Patient Management**: View and manage assigned patients
- **Exercise Planning**: Create and assign structured exercise routines
- **Performance Monitoring**: Review patient progress and compliance
- **Progress Analytics**: Analyze patient performance over time

### [🔧] For Admins
- **User Management**: Create, edit, and delete user accounts
- **Role Management**: Assign and modify user roles
- **System Analytics**: View system-wide statistics and analytics

## Tech Stack

- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS v3** - Styling (utility-first CSS framework)
- **Vite** - Build tool and dev server
- **PostCSS & Autoprefixer** - CSS processing

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── FormElements.jsx # Form inputs, buttons, cards
│   ├── Navigation.jsx   # Top navigation bar
│   ├── Footer.jsx       # Footer
│   ├── Alert.jsx        # Alert messages
│   ├── Spinner.jsx      # Loading spinner
│   ├── ProtectedRoute.jsx # Protected route wrapper
│   └── Layout.jsx       # Main layout wrapper
├── context/             # React Context for state management
│   └── AuthContext.jsx  # Authentication context and hooks
├── pages/               # Page components
│   ├── HomePage.jsx     # Home/dashboard
│   ├── LoginPage.jsx    # Login page
│   ├── RegisterPage.jsx # Registration page
│   ├── ProfilePage.jsx  # User profile management
│   ├── MedicalHistoryPage.jsx  # Patient medical records
│   ├── ExercisesPage.jsx       # Exercise routines
│   ├── ProgressPage.jsx        # Progress tracking
│   ├── PatientsPage.jsx        # Therapist patient list
│   ├── AssignmentsPage.jsx     # Exercise assignments
│   ├── AdminUsersPage.jsx      # Admin user management
│   └── AdminDashboardPage.jsx  # Admin dashboard
├── services/            # API services
│   └── api.js          # Axios instance and API calls
├── App.jsx             # Main app component with routing
├── main.jsx            # React entry point
├── index.css           # Global styles
└── .env.example        # Example environment variables
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create .env file** (copy from .env.example)
   ```bash
   cp .env.example .env
   ```

3. **Update environment variables** in `.env`:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_APP_NAME="Physical Therapy Management System"
   ```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Optimized files will be in the `dist/` directory.

## Key Components & Hooks

### AuthContext
Provides authentication state and methods across the app:
- `useAuth()` - Hook to access auth context
- `login()` - Login user
- `register()` - Register new user
- `logout()` - Logout user
- `updateProfile()` - Update user profile

### API Service
Centralized API calls with automatic token handling:
- `authAPI` - Authentication endpoints
- `medicalAPI` - Medical history endpoints
- `assignmentAPI` - Patient assignment endpoints
- `adminAPI` - User management endpoints

### Protected Routes
- `<ProtectedRoute>` - Requires authentication
- `<ProtectedRoute requiredRole="PATIENT">` - Role-specific access

## API Integration

The frontend communicates with the Django REST API:
- **Base URL**: `http://localhost:8000`
- **Authentication**: JWT Bearer tokens in Authorization header
- **Response Format**: Standard JSON with `success`, `message`, and `result` fields

### Endpoints Used

**Auth Endpoints**
- `POST /api/account/register/` - User registration
- `POST /api/account/login/` - User login
- `POST /api/account/logout/` - User logout
- `GET /api/account/me/` - Get current user
- `PATCH /api/account/me/` - Update user profile
- `POST /api/account/change-password/` - Change password

**Medical Endpoints**
- `GET /api/medicals/medical-history/` - List medical histories
- `POST /api/medicals/medical-history/` - Create medical history
- `PATCH /api/medicals/medical-history/{id}/` - Update medical history
- `GET /api/medicals/assignments/` - List assignments
- `POST /api/medicals/assignments/` - Create assignment
- `PATCH /api/medicals/assignments/{id}/` - Update assignment

**Admin Endpoints**
- `GET /api/account/users/` - List all users
- `GET /api/account/users/{id}/` - Get user details
- `PATCH /api/account/users/{id}/` - Update user
- `DELETE /api/account/users/{id}/` - Delete user

## Tailwind CSS v3 Customization

Tailwind configuration is in `tailwind.config.js`:
- Custom primary color scheme
- Responsive design utilities
- Custom component classes

## Demo Credentials

For testing purposes:
- **Patient**: patient@example.com / password
- **Therapist**: therapist@example.com / password
- **Admin**: admin@example.com / password

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable names
- Keep components modular and reusable

### Styling
- Use Tailwind CSS utility classes
- Define custom styles in `index.css`
- Maintain consistent spacing and typography
- Use the custom color palette

### Error Handling
- Display user-friendly error messages
- Use the Alert component for notifications
- Handle API errors gracefully

## Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Deploy the dist folder
```

### Environment Variables for Production
- `VITE_API_URL` - Production API URL

## Troubleshooting

### CORS Issues
- Ensure backend has `CORS_ALLOWED_ORIGINS` configured for frontend URL
- Check `vite.config.js` proxy settings

### Authentication Issues
- Clear browser localStorage and try again
- Check if API server is running
- Verify JWT token format in browser console

### Styling Issues
- Clear cache: `npm run build && npm run preview`
- Ensure Tailwind CSS is properly installed
- Check `tailwind.config.js` content paths

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

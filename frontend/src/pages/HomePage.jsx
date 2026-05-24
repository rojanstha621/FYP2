import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, Button } from '../components/FormElements';

export const HomePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/70 backdrop-blur-xl">
                Coordinated care for therapy teams
              </div>

              <div className="space-y-5 max-w-3xl">
                <h1 className="text-5xl md:text-7xl font-bold text-palette-dark leading-[0.95]">
                  Physical therapy management with clarity, rhythm, and care.
                </h1>
                <p className="text-lg md:text-xl text-palette-dark/70 max-w-2xl">
                  A coordinated workspace for patients, therapists, nurses, and admins to manage medical histories,
                  appointments, guided videos, and progress in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button variant="primary">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary">Register</Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-xl">
                {[
                  ['4 roles', 'Patient, therapist, nurse, admin'],
                  ['Guided sessions', 'Video plans with scheduling'],
                  ['Structured records', 'Histories and reports in one view'],
                  ['Live workflows', 'Assignments, feedback, appointments'],
                ].map(([title, description]) => (
                  <div key={title} className="glass-panel rounded-3xl p-4">
                    <p className="text-sm font-bold text-palette-dark">{title}</p>
                    <p className="mt-1 text-sm text-palette-dark/65">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in-up">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-palette-mauve/15 to-palette-blush/20 blur-2xl"></div>
              <div className="relative glass-panel-strong rounded-[2rem] p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-palette-dark/50">Overview</p>
                    <h2 className="mt-2 text-3xl font-bold text-palette-dark">One place for the whole care team</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    'Medical histories created and updated by nurses',
                    'Therapist and nurse assignments kept in sync',
                    'Appointments linked to the right care team members',
                    'Feedback, video guidance, and progress tracking together',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-palette-mauve text-white text-sm">✓</span>
                      <span className="text-sm font-medium text-palette-dark/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to role-specific dashboard
  const userRole = user.role;
  const firstName = user.first_name || 'User';

  if (userRole === 'PATIENT') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Patient dashboard</p>
            <h1 className="mt-2 text-4xl font-bold text-palette-dark">Welcome, {firstName}!</h1>
            <p className="text-palette-dark/65 mt-2">Let's continue your rehabilitation journey</p>
          </div>
          <div className="glass-panel rounded-3xl px-4 py-3 text-sm text-palette-dark/70">
            Your care plan is ready to view below.
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-palette-dark mb-3">Medical History</h3>
            <p className="text-palette-dark/60 mb-4">View and manage your medical records and history</p>
            <Link to="/medical-history">
              <Button variant="primary" className="w-full">
                View Details
              </Button>
            </Link>
          </Card>

          <Card className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-palette-dark mb-3">My Videos</h3>
            <p className="text-palette-dark/60 mb-4">View videos assigned by your therapist</p>
            <Link to="/patient/videos">
              <Button variant="primary" className="w-full">
                View Videos
              </Button>
            </Link>
          </Card>

          <Card className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-palette-dark mb-3">Feedback</h3>
            <p className="text-palette-dark/60 mb-4">Read therapist feedback and update your progress</p>
            <Link to="/patient/feedback">
              <Button variant="primary" className="w-full">
                Open Feedback
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole === 'THERAPIST') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Therapist dashboard</p>
            <h1 className="mt-2 text-4xl font-bold text-palette-dark">Welcome, Dr. {firstName}!</h1>
            <p className="text-palette-dark/65 mt-2">Manage your patients and their rehabilitation programs</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <h3 className="text-xl font-bold text-palette-dark mb-3">My Patients</h3>
            <p className="text-palette-dark/60 mb-4">View and manage your assigned patients</p>
            <Link to="/patients">
              <Button variant="primary" className="w-full">
                View Patients
              </Button>
            </Link>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-palette-dark mb-3">Assignments</h3>
            <p className="text-palette-dark/60 mb-4">Create and manage therapist-patient assignments</p>
            <Link to="/assignments">
              <Button variant="primary" className="w-full">
                Manage Assignments
              </Button>
            </Link>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-palette-dark mb-3">Videos</h3>
            <p className="text-palette-dark/60 mb-4">Browse and assign guided exercise videos</p>
            <Link to="/therapist/videos">
              <Button variant="primary" className="w-full">
                Open Videos
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole === 'NURSE') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Nurse dashboard</p>
            <h1 className="mt-2 text-4xl font-bold text-palette-dark">Welcome, {firstName}!</h1>
            <p className="text-palette-dark/65 mt-2">Coordinate patient histories, assignments, and appointments</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold text-palette-dark mb-3">Patients & Medical Histories</h3>
            <p className="text-palette-dark/60 mb-4">Assign patients and update their health records</p>
            <Link to="/nurse/patients">
              <Button variant="primary" className="w-full">Open Patients</Button>
            </Link>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-palette-dark mb-3">Appointments</h3>
            <p className="text-palette-dark/60 mb-4">Schedule and manage patient appointments</p>
            <Link to="/nurse/appointments">
              <Button variant="primary" className="w-full">Open Appointments</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Admin dashboard</p>
          <h1 className="mt-2 text-4xl font-bold text-palette-dark">Admin Dashboard</h1>
          <p className="text-palette-dark/65 mt-2">System administration and management</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <h3 className="text-xl font-bold text-palette-dark mb-3">User Management</h3>
          <p className="text-palette-dark/60 mb-4">Manage all system users and permissions</p>
          <Link to="/admin/users">
            <Button variant="primary" className="w-full">Manage Users</Button>
          </Link>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-palette-dark mb-3">Nurse Management</h3>
          <p className="text-palette-dark/60 mb-4">Review nurse-led patient care and appointments</p>
          <Link to="/nurse">
            <Button variant="primary" className="w-full">Open Nurse Tools</Button>
          </Link>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-palette-dark mb-3">System Analytics</h3>
          <p className="text-palette-dark/60 mb-4">View system statistics and analytics</p>
          <Link to="/admin/dashboard">
            <Button variant="primary" className="w-full">View Analytics</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

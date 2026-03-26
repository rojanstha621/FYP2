import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, Button } from '../components/FormElements';

export const HomePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palette-beige to-palette-mauve">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-palette-dark mb-4">
              Physical Therapy Management
            </h1>
            <p className="text-xl text-palette-dark/70 mb-8">
              Guided rehabilitation, exercise tracking, and progress monitoring in one platform
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login">
                <Button variant="primary">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary">Register</Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-2xl font-bold text-palette-mauve mb-3">Medical Records</h3>
              <p className="text-palette-dark/70">
                Securely store and manage comprehensive medical history including past injuries, medications, and allergies.
              </p>
            </Card>

            <Card>
              <h3 className="text-2xl font-bold text-palette-mauve mb-3">Exercise Routines</h3>
              <p className="text-palette-dark/70">
                Follow structured exercise plans with instructional videos, timers, and step-by-step guidance.
              </p>
            </Card>

            <Card>
              <h3 className="text-2xl font-bold text-palette-mauve mb-3">Progress Tracking</h3>
              <p className="text-palette-dark/70">
                Record pain levels, difficulty ratings, and monitor your rehabilitation progress over time.
              </p>
            </Card>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="bg-palette-cream rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-palette-dark mb-4">For Patients</h3>
              <ul className="space-y-3 text-palette-dark/70">
                <li><span className="text-palette-blush">✓</span> Complete assigned exercises with video guidance</li>
                <li><span className="text-palette-blush">✓</span> Track pain and difficulty levels during sessions</li>
                <li><span className="text-palette-blush">✓</span> View personalized progress analytics</li>
                <li><span className="text-palette-blush">✓</span> Manage medical history and reports</li>
                <li><span className="text-palette-blush">✓</span> Communicate with your therapist</li>
              </ul>
            </div>

            <div className="bg-palette-cream rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-palette-dark mb-4">For Therapists</h3>
              <ul className="space-y-3 text-palette-dark/70">
                <li><span className="text-palette-blush">✓</span> Assign exercise routines to patients</li>
                <li><span className="text-palette-blush">✓</span> Review patient medical backgrounds</li>
                <li><span className="text-palette-blush">✓</span> Monitor exercise completion and performance</li>
                <li><span className="text-palette-blush">✓</span> Provide feedback and adjust plans</li>
                <li><span className="text-palette-blush">✓</span> Track patient progress analytically</li>
              </ul>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-palette-dark mb-2">
            Welcome, {firstName}!
          </h1>
          <p className="text-palette-dark/60">Let's continue your rehabilitation journey</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-xl font-bold text-palette-mauve mb-3">My Medical History</h3>
            <p className="text-palette-dark/60 mb-4">View and manage your medical records and history</p>
            <Link to="/medical-history">
              <Button variant="primary" className="w-full">
                View Details
              </Button>
            </Link>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-palette-mauve mb-3">My Exercises</h3>
            <p className="text-palette-dark/60 mb-4">View exercise routines and educational content</p>
            <Link to="/exercises">
              <Button variant="primary" className="w-full">
                View Exercises
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole === 'THERAPIST') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-palette-dark mb-2">
            Welcome, Dr. {firstName}!
          </h1>
          <p className="text-palette-dark/60">Manage your patients and their rehabilitation programs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-bold text-palette-mauve mb-3">My Patients</h3>
            <p className="text-palette-dark/60 mb-4">View and manage your assigned patients</p>
            <Link to="/patients">
              <Button variant="primary" className="w-full">
                View Patients
              </Button>
            </Link>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-palette-mauve mb-3">Assignments</h3>
            <p className="text-palette-dark/60 mb-4">Create and manage exercise assignments</p>
            <Link to="/assignments">
              <Button variant="primary" className="w-full">
                Manage Assignments
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-palette-dark mb-2">Admin Dashboard</h1>
        <p className="text-palette-dark/60">System administration and management</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-bold text-palette-mauve mb-3">User Management</h3>
          <p className="text-palette-dark/60 mb-4">Manage all system users and permissions</p>
          <Link to="/admin/users">
            <Button variant="primary" className="w-full">
              Manage Users
            </Button>
          </Link>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-palette-mauve mb-3">System Analytics</h3>
          <p className="text-palette-dark/60 mb-4">View system statistics and analytics</p>
          <Link to="/admin/dashboard">
            <Button variant="primary" className="w-full">
              View Analytics
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

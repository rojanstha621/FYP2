import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Show a minimal nav for unauthenticated users
  if (!user) {
    return (
      <nav className="bg-palette-cream/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="PT Manager Logo" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-palette-dark hover:text-palette-mauve transition-all">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Register
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const userRole = user.role;
  const firstName = user.first_name || 'User';

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      PATIENT: 'bg-blue-100 text-blue-800',
      THERAPIST: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-palette-beige text-palette-dark';
  };

  return (
    <nav className="bg-palette-cream/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logo} alt="PT Manager Logo" className="h-12 w-auto" />
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              {userRole === 'PATIENT' && (
                <>
                   <Link to="/dashboard" className="text-palette-dark hover:text-palette-mauve transition-all">
                     Dashboard
                   </Link>
                   <Link to="/therapists" className="text-palette-dark hover:text-palette-mauve transition-all">
                     Therapists
                   </Link>
                  <Link to="/exercises" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Exercises
                  </Link>
                  <Link to="/medical-history" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Medical History
                  </Link>
                  <Link to="/progress" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Progress
                  </Link>
                </>
              )}

              {userRole === 'THERAPIST' && (
                <>
                  <Link to="/patients" className="text-palette-dark hover:text-palette-mauve transition-all">
                    My Patients
                  </Link>
                  <Link to="/therapist/pending-requests" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Pending Requests
                  </Link>
                  <Link to="/assignments" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Assignments
                  </Link>
                </>
              )}

              {userRole === 'ADMIN' && (
                <>
                  <Link to="/admin/users" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Users
                  </Link>
                  <Link to="/admin/dashboard" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Dashboard
                  </Link>
                  <Link to="/admin/pending-therapists" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Pending Therapists
                  </Link>
                  <Link to="/admin/assignments" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Assignments
                  </Link>
                  <Link to="/admin/pending-assignments" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Pending Requests
                  </Link>
                  <Link to="/admin/medical-histories" className="text-palette-dark hover:text-palette-mauve transition-all">
                    Medical Records
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(userRole)}`}>
                {userRole}
              </span>
              <Link to="/profile" className="text-palette-dark hover:text-palette-mauve transition-all">
                {firstName}
              </Link>
              <button
                onClick={handleLogout}
                className="btn-primary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

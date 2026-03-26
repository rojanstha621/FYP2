import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
  const lastName = user.last_name || '';
  const userEmail = user.email || '';
  const profileImage = user.profile_picture || user.profile?.profile_picture || '';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: 'bg-palette-mauve/20 text-palette-mauve border border-palette-mauve',
      PATIENT: 'bg-palette-blush/30 text-palette-dark border border-palette-blush',
      THERAPIST: 'bg-green-100 text-green-800 border border-green-200',
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(userRole)}`}>
              {userRole}
            </span>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="h-10 w-10 overflow-hidden rounded-full border-2 border-palette-mauve/40 bg-palette-beige hover:border-palette-mauve"
                aria-label="Open user menu"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-palette-dark">
                    {initials}
                  </span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 z-30 w-52 rounded-lg border border-palette-mauve/30 bg-palette-cream shadow-lg">
                  <div className="border-b border-palette-mauve/20 px-4 py-3">
                    <p className="text-sm font-semibold text-palette-dark">{firstName} {lastName}</p>
                    <p className="text-xs text-palette-dark/60 truncate">{userEmail}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-palette-dark hover:bg-palette-beige"
                  >
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await handleLogout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

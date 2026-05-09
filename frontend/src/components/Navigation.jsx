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
      <nav className="sticky top-0 z-40 border-b border-white/40 bg-white/55 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="HealMe Logo" className="h-11 w-auto rounded-2xl shadow-sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-palette-dark/70 hover:text-palette-mauve transition-all font-semibold">
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
      NURSE: 'bg-sky-100 text-sky-800 border border-sky-200',
    };
    return colors[role] || 'bg-palette-beige text-palette-dark';
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/40 bg-white/55 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="HealMe Logo" className="h-11 w-auto rounded-2xl shadow-sm" />
          </Link>

          <div className="flex items-center gap-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${getRoleBadge(userRole)}`}>
              {userRole}
            </span>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="h-11 w-11 overflow-hidden rounded-full border border-white/60 bg-white/80 shadow-lg ring-1 ring-palette-mauve/15 hover:scale-105 transition-transform"
                aria-label="Open user menu"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-palette-dark">
                    {initials}
                  </span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-14 z-30 w-56 rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl animate-fade-in-up">
                  <div className="border-b border-palette-dark/10 px-4 py-3">
                    <p className="text-sm font-semibold text-palette-dark">{firstName} {lastName}</p>
                    <p className="text-xs text-palette-dark/60 truncate">{userEmail}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 text-sm text-palette-dark hover:bg-palette-beige/50 transition-colors"
                  >
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await handleLogout();
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 transition-colors"
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

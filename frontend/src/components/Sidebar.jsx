import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const roleLinks = {
  PATIENT: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/therapists', label: 'Therapists' },
    { to: '/patient/sessions', label: 'Sessions' },
    { to: '/patient/plans', label: 'My Plans' },
    { to: '/exercises', label: 'Exercises' },
    { to: '/patient/videos', label: 'My Videos' },
    { to: '/patient/progress', label: 'Progress' },
    { to: '/patient/feedback', label: 'Feedback' },
    { to: '/medical-history', label: 'Medical History' },
  ],
  THERAPIST: [
    { to: '/patients', label: 'My Patients' },
    { to: '/therapist/pending-requests', label: 'Pending Requests' },
    { to: '/therapist/exercise-plans', label: 'Exercise Plans' },
    { to: '/assignments', label: 'Assignments' },
    { to: '/therapist/videos', label: 'Videos' },
    { to: '/therapist/overview', label: 'Overview' },
    { to: '/therapist/feedback', label: 'Feedback' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/pending-therapists', label: 'Pending Therapists' },
    { to: '/admin/videos', label: 'Videos' },
    { to: '/admin/medical-histories', label: 'Medical Histories' },
    { to: '/admin/pending-assignments', label: 'Pending Assignments' },
  ],
};

export const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = roleLinks[user.role] || [];

  return (
    <aside className="hidden md:block w-64 shrink-0 border-r border-palette-mauve/20 bg-palette-cream/80">
      <div className="sticky top-0 h-[calc(100vh-5rem)] overflow-y-auto p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-palette-dark/60">
          Navigation
        </h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to + '/'));

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-palette-mauve text-white'
                    : 'text-palette-dark hover:bg-palette-beige'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

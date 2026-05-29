import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const roleLinks = {
  PATIENT: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/therapists', label: 'Therapists' },
    { to: '/patient/videos', label: 'My Videos' },
    { to: '/patient/feedback', label: 'Feedback' },
    { to: '/medical-history', label: 'Medical History' },
  ],
  THERAPIST: [
    { to: '/therapist/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'My Patients' },
    { to: '/therapist/pending-requests', label: 'Pending Requests' },
    { to: '/therapist/nurse-assignments', label: 'Nurse Assignments' },
    { to: '/assignments', label: 'Assignments' },
    { to: '/therapist/videos', label: 'Videos' },
    { to: '/therapist/feedback', label: 'Feedback' },
  ],
  NURSE: [
    { to: '/nurse', label: 'Dashboard' },
    { to: '/nurse/patients', label: 'Patients & Histories' },
    { to: '/nurse/appointments', label: 'Appointments' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/pending-therapists', label: 'Pending Therapists' },
    { to: '/nurse', label: 'Nurse Management' },
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
    <aside className="hidden md:block w-72 shrink-0 px-4 py-4">
      <div className="sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto rounded-[2rem] glass-panel-strong p-4 lg:p-5">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-palette-dark to-[#5c4745] px-4 py-4 text-white shadow-lg shadow-palette-dark/20">
          <p className="text-xs uppercase tracking-[0.22em] text-white/70">Workspace</p>
          <p className="mt-2 text-lg font-semibold">{user?.role} Portal</p>
        </div>

        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-palette-dark/55">
          Navigation
        </h2>
        <nav className="space-y-2">
          {links.map((link) => {
            const isDashboardLink = link.label === 'Dashboard' || link.to.endsWith('/dashboard') || link.to === '/nurse';
            const isActive =
              location.pathname === link.to ||
              (!isDashboardLink && link.to !== '/' && location.pathname.startsWith(link.to + '/'));

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-palette-mauve to-[#6f4c60] text-white shadow-lg shadow-palette-mauve/25 translate-x-1'
                    : 'text-palette-dark/70 hover:bg-white/70 hover:text-palette-dark'
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

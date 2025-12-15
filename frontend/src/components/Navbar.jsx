// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            PT
          </span>
          <span className="text-xl font-semibold tracking-tight text-slate-100">
            PhysioCare
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-200 hover:text-sky-400 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors shadow-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-200 hover:text-sky-400 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors shadow-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

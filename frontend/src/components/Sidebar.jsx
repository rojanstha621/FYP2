// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";

const linkBaseClasses =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
const inactiveClasses = "text-slate-300 hover:bg-slate-800 hover:text-sky-400";
const activeClasses = "bg-sky-500/10 text-sky-400 border border-sky-500/50";

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 px-4 pt-6 pb-6 ml-4">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            Main
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkBaseClasses} ${
                  isActive ? activeClasses : inactiveClasses
                }`
              }
            >
              <span className="text-lg">🏠</span>
              <span>Dashboard</span>
            </NavLink>
          </nav>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            Coming soon
          </p>
          <nav className="space-y-1">
            <div
              className={`${linkBaseClasses} ${inactiveClasses} cursor-default opacity-60`}
            >
              <span className="text-lg">🏋️‍♀️</span>
              <span>Exercises</span>
            </div>
            <div
              className={`${linkBaseClasses} ${inactiveClasses} cursor-default opacity-60`}
            >
              <span className="text-lg">👤</span>
              <span>Patients / Profile</span>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}

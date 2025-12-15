// src/layouts/DashboardLayout.jsx
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="bg-slate-900 text-slate-100">
      <div className="max-w-full mx-auto flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)] border-l border-slate-800/60 bg-slate-950/40 p-5">
          <div className="px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

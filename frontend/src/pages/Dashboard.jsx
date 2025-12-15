// src/pages/Dashboard.jsx
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { accessToken } = useAuth();

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to your Dashboard
        </h1>
        <p className="text-slate-300 text-base">
          You&apos;re logged in with a valid JWT from the Django backend.
        </p>
      </div>

      {/* summary cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <article className="bg-slate-800 rounded-2xl p-6 shadow-lg space-y-2">
          <h2 className="text-lg font-semibold text-slate-100">
            Exercise Summary
          </h2>
          <p className="text-sm text-slate-300">
            Later you can show today&apos;s assigned exercises and total sets
            here.
          </p>
        </article>

        <article className="bg-slate-800 rounded-2xl p-6 shadow-lg space-y-2">
          <h2 className="text-lg font-semibold text-slate-100">
            Progress
          </h2>
          <p className="text-sm text-slate-300">
            This card can show weekly completion percentage and pain trends.
          </p>
        </article>

        <article className="bg-slate-800 rounded-2xl p-6 shadow-lg space-y-2 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-100">
            Notifications
          </h2>
          <p className="text-sm text-slate-300">
            Show reminders, therapist feedback, and new assigned exercises here.
          </p>
        </article>
      </div>

      {/* debug token */}
      <div className="pt-2">
        <p className="text-xs text-slate-500 break-all">
               </p>
      </div>
    </div>
  );
}

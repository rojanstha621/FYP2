// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");

  if (isAuthenticated) {
    // If already logged in, send to dashboard
    navigate("/dashboard");
  }

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const res = await login(form.email, form.password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setErrorMsg(res.message || "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl shadow-xl p-10 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-100">Login</h2>
          <p className="text-sm text-slate-300">
            Use the email and password registered in the Django backend.
          </p>
        </div>

        {errorMsg && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-base text-slate-200 mb-1">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-base text-slate-200 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 text-white py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-sky-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

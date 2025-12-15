// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (isAuthenticated) {
    navigate("/dashboard");
  }

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const res = await register(form);
    if (res.success) {
      setSuccessMsg("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } else {
      setErrorMsg(res.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl shadow-xl p-10 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-100">Register</h2>
          <p className="text-sm text-slate-300">
            Create an account to access the physio platform.
          </p>
        </div>

        {errorMsg && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-500/40 px-3 py-2 rounded-lg">
            {successMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-base text-slate-200 mb-1">
                First name
              </label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={onChange}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-base text-slate-200 mb-1">
                Last name
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={onChange}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

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
              Phone number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={onChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

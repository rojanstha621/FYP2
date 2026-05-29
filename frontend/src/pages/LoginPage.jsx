import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { AuthPageLayout } from '../components/AuthPageLayout';
import logo from '../assets/logo.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, loading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localInfo, setLocalInfo] = useState(location.state?.message || '');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    const currentUser = await login(formData.email, formData.password);
    if (currentUser) {
      const nextRoute = currentUser.role === 'THERAPIST'
        ? '/therapist/dashboard'
        : currentUser.role === 'NURSE'
          ? '/nurse'
          : currentUser.role === 'ADMIN'
            ? '/admin/dashboard'
            : '/dashboard';

      navigate(nextRoute);
    }
  };

  return (
    <AuthPageLayout>
          <div className="flex justify-center mb-8">
            <img src={logo} alt="HealMe Logo" className="h-12 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-palette-dark mb-6 text-center">Login</h2>

          {(localInfo || error || localError) && (
            localInfo ? (
              <Alert type="success" message={localInfo} onClose={() => setLocalInfo('')} />
            ) : (
            <Alert type="error" message={error || localError} onClose={() => setLocalError('')} />
            )
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-palette-dark/80 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 px-3 text-sm text-palette-dark/70 hover:text-palette-dark"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-palette-dark/60 text-center">
            If you just registered, open the verification email first and then return here.
          </p>

          <div className="mt-6 text-center space-y-3">
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-palette-mauve hover:text-palette-dark">
                Forgot password?
              </Link>
            </div>
            <p className="text-palette-dark/70">
              Don't have an account?{' '}
              <Link to="/register" className="text-palette-mauve hover:text-palette-dark font-semibold">
                Register here
              </Link>
            </p>
          </div>

          {/* <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-palette-dark/60 font-semibold mb-2">Demo Credentials:</p>
            <p className="text-sm text-palette-dark/60">Patient: patient@example.com / password</p>
            <p className="text-sm text-palette-dark/60">Therapist: therapist@example.com / password</p>
            <p className="text-sm text-palette-dark/60">Nurse: nurse@example.com / password</p>
            <p className="text-sm text-palette-dark/60">Admin: admin@example.com / password</p>
          </div> */}
    </AuthPageLayout>
  );
};

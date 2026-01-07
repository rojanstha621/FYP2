import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/FormElements';
import { Alert } from '../components/Alert';
import logo from '../assets/logo.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error, loading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');

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

    const success = await login(formData.email, formData.password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-beige to-palette-mauve flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-palette-cream rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="PT Manager Logo" className="h-12 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-palette-dark mb-6 text-center">Login</h2>

          {(error || localError) && (
            <Alert type="error" message={error || localError} onClose={() => setLocalError('')} />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
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
            <p className="text-sm text-palette-dark/60">Admin: admin@example.com / password</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

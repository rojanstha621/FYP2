import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Select } from '../components/FormElements';
import { Alert } from '../components/Alert';
import logo from '../assets/logo.png';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error, loading } = useAuth();
  const [localError, setLocalError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    role: 'PATIENT',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.email || !formData.first_name || !formData.password) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    const success = await register({
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
      password: formData.password,
      role: formData.role,
    });

    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-beige to-palette-mauve flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-palette-cream rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="PT Manager Logo" className="h-12 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-palette-dark mb-6 text-center">Create Account</h2>

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
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="first_name"
                label="First Name"
                placeholder="John"
                value={formData.first_name}
                onChange={handleChange}
                disabled={loading}
                required
              />

              <Input
                type="text"
                name="last_name"
                label="Last Name"
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <Input
              type="tel"
              name="phone_number"
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              value={formData.phone_number}
              onChange={handleChange}
              disabled={loading}
            />

            <Select
              name="role"
              label="Select Your Role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="PATIENT">Patient</option>
              <option value="THERAPIST">Therapist</option>
            </Select>

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <Input
              type="password"
              name="password_confirm"
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.password_confirm}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-palette-dark/70">
              Already have an account?{' '}
              <Link to="/login" className="text-palette-mauve hover:text-palette-dark font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

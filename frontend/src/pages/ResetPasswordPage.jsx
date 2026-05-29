import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Button, Input } from '../components/FormElements';
import { AuthPageLayout } from '../components/AuthPageLayout';
import logo from '../assets/logo.png';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    setUid(searchParams.get('uid') || '');
    setToken(searchParams.get('token') || '');
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!uid || !token) {
      setError('This reset link is missing required information.');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.confirmPasswordReset({
        uid,
        token,
        new_password: formData.newPassword,
        confirm_new_password: formData.confirmPassword,
      });
      const payload = response.data?.result || response.data;
      const successMessage = payload?.message || 'Password reset successful. You can now log in.';
      setMessage(successMessage);
      setTimeout(() => {
        navigate('/login', { replace: true, state: { message: successMessage } });
      }, 1800);
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.detail || data?.message || data?.confirm_new_password || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="flex justify-center mb-8">
        <img src={logo} alt="HealMe Logo" className="h-12 w-auto" />
      </div>

      <h2 className="text-2xl font-bold text-palette-dark mb-3 text-center">Reset password</h2>
      <p className="text-sm text-palette-dark/65 text-center mb-6">
        Choose a new password for your account.
      </p>

      {(message || error) && (
        <div className="mb-5">
          <Alert
            type={message ? 'success' : 'error'}
            message={message || error}
            onClose={() => {
              setMessage('');
              setError('');
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          name="newPassword"
          label="New Password"
          value={formData.newPassword}
          onChange={handleChange}
          disabled={loading}
        />

        <Input
          type="password"
          name="confirmPassword"
          label="Confirm New Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
        />

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-palette-mauve hover:text-palette-dark font-semibold">
          Back to login
        </Link>
      </div>
    </AuthPageLayout>
  );
};
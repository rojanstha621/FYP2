import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Button, Input } from '../components/FormElements';
import { AuthPageLayout } from '../components/AuthPageLayout';
import logo from '../assets/logo.png';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.requestPasswordReset({ email });
      const payload = response.data?.result || response.data;
      setMessage(payload?.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.detail || data?.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="flex justify-center mb-8">
        <img src={logo} alt="HealMe Logo" className="h-12 w-auto" />
      </div>

      <h2 className="text-2xl font-bold text-palette-dark mb-3 text-center">Forgot password</h2>
      <p className="text-sm text-palette-dark/65 text-center mb-6">
        Enter your email and we will send a reset link if the account exists.
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
          type="email"
          name="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Sending link...' : 'Send reset link'}
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
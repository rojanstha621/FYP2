import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Button } from '../components/FormElements';
import logo from '../assets/logo.png';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifying your email...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    let redirectTimer;

    if (!uid || !token) {
      setMessage('This verification link is incomplete or invalid.');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await authAPI.verifyEmail({ uid, token });
        const payload = response.data?.result || response.data;
        setMessage(payload?.message || 'Email verified successfully. You can now log in.');
        setIsSuccess(true);
        redirectTimer = setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: { message: 'Email verified successfully. You can now log in.' },
          });
        }, 1800);
      } catch (err) {
        const data = err?.response?.data;
        const errorMessage = data?.detail || data?.message || 'Verification failed. Please request a new link.';
        setMessage(errorMessage);
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-beige to-palette-mauve flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-palette-cream rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="HealMe Logo" className="h-12 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-palette-dark mb-6">Email Verification</h2>

          <div className="mb-6">
            <Alert
              type={isSuccess ? 'success' : 'error'}
              message={message}
              onClose={() => setMessage('')}
            />
          </div>

          <p className="text-sm text-palette-dark/70 mb-6">
            {loading ? 'Please wait while we confirm your account.' : 'You can continue to login once verification is complete.'}
          </p>

          <Button type="button" variant="primary" className="w-full" onClick={() => navigate('/login')}>
            Go to Login
          </Button>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-palette-mauve hover:text-palette-dark font-semibold">
              Back to registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
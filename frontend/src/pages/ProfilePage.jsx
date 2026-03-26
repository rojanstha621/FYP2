import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';
import { Card, Button, Input, Textarea } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    bio: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const profilePictureUrl = resolveMediaUrl(profile?.profile?.profile_picture);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getMe();
      const payload = response.data?.result || response.data;
      setProfile(payload);
      setFormData({
        first_name: payload?.user?.first_name || '',
        last_name: payload?.user?.last_name || '',
        phone_number: payload?.user?.phone_number || '',
        address: payload?.profile?.address || '',
        bio: payload?.profile?.bio || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const success = await updateProfile(formData);
    if (success) {
      setSuccess('Profile updated successfully');
      await fetchProfile();
    } else {
      setError('Failed to update profile');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    const formDataWithImage = new FormData();
    formDataWithImage.append('profile_picture', file);

    try {
      await authAPI.uploadProfilePicture(formDataWithImage);
      setSuccess('Profile picture updated successfully');
      await fetchProfile();
    } catch (err) {
      setError('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setSuccess('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Failed to change password');
    }
  };

  if (loading) return <Spinner />;

  if (!profile) return <div className="text-center py-8">Failed to load profile</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-palette-dark mb-8">My Profile</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card>
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-palette-cream rounded-full flex items-center justify-center text-4xl mb-3 overflow-hidden border-2 border-palette-mauve/30">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-palette-mauve">{profile.user.first_name.charAt(0)}{profile.user.last_name.charAt(0)}</span>
              )}
            </div>
            <label className="btn-primary cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
              Change Photo
            </label>
            {uploadingImage && (
              <p className="text-sm text-palette-dark/60 mt-2">Uploading...</p>
            )}
          </div>

          <div className="flex-1">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-bold text-palette-dark">
                {profile.user.first_name} {profile.user.last_name}
              </h2>
              <p className="text-palette-dark/70">{profile.user.email}</p>
              <p className="text-sm text-palette-dark/60">
                Joined {new Date(profile.user.created_at).toLocaleDateString()}
              </p>
              <span className="inline-block px-3 py-1 bg-palette-cream text-palette-mauve rounded-full text-sm font-medium border border-palette-mauve/30">
                {profile.user.role}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-bold text-palette-dark mt-8 mb-4">Personal Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Phone Number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleChange}
          />

          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />

          <Textarea
            label="Bio"
            name="bio"
            rows="4"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
          />

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={fetchProfile}>
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-palette-cream/40">
          <h3 className="text-lg font-bold text-palette-dark mb-4">Security</h3>
          <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
        </div>
      </Card>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                setError('');
              }}
              className="float-right text-2xl font-bold text-palette-dark/60 hover:text-palette-dark"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-palette-dark mb-6 clear-right">
              Change Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-palette-dark/80 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    name="old_password"
                    className="w-full px-4 py-2 border border-palette-cream/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-mauve focus:border-transparent"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 px-3 text-sm text-palette-dark/70 hover:text-palette-dark"
                  >
                    {showOldPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-palette-dark/80 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="new_password"
                    className="w-full px-4 py-2 border border-palette-cream/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-mauve focus:border-transparent"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 px-3 text-sm text-palette-dark/70 hover:text-palette-dark"
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-palette-dark/80 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    className="w-full px-4 py-2 border border-palette-cream/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-mauve focus:border-transparent"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 px-3 text-sm text-palette-dark/70 hover:text-palette-dark"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  Change Password
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

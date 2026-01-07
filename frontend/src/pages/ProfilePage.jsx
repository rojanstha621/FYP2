import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Card, Button, Input, Textarea } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getMe();
      setProfile(response.data.result);
      setFormData({
        first_name: response.data.result.user.first_name,
        last_name: response.data.result.user.last_name,
        phone_number: response.data.result.user.phone_number || '',
        address: response.data.result.profile.address || '',
        bio: response.data.result.profile.bio || '',
      });
    } catch (err) {
      setError('Failed to load profile');
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
            <div className="w-32 h-32 bg-palette-cream rounded-full flex items-center justify-center text-4xl mb-4 overflow-hidden">
              {profile.profile.profile_picture ? (
                <img
                  src={profile.profile.profile_picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-palette-mauve">{profile.user.first_name.charAt(0)}{profile.user.last_name.charAt(0)}</span>
              )}
            </div>
            <label className="btn-primary">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
            {uploadingImage && <p className="text-sm text-palette-dark/60 mt-2">Uploading...</p>}
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
              <span className="inline-block px-3 py-1 bg-palette-cream text-palette-mauve rounded-full text-sm font-medium">
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
      </Card>
    </div>
  );
};

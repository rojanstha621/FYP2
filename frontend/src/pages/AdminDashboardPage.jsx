import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { Card, Button } from '../components/FormElements';
import { Spinner } from '../components/Spinner';
import { Alert } from '../components/Alert';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    return [];
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getUsers({ page_size: 1000 });
      console.log('Admin Dashboard API Response:', response.data);

      const users = extractList(response.data);

      const stats = {
        totalUsers: users.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        therapists: users.filter(u => u.role === 'THERAPIST').length,
        patients: users.filter(u => u.role === 'PATIENT').length,
        activeUsers: users.filter(u => u.is_active).length,
        inactiveUsers: users.filter(u => !u.is_active).length,
      };

      setStats(stats);
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
        <Alert type="error" message={error} onClose={() => setError('')} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Admin dashboard</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold text-palette-dark">System overview</h1>
          <p className="mt-2 text-palette-dark/70">Monitor users, roles, and the overall platform health.</p>
        </div>
        <div className="glass-panel-strong rounded-3xl px-4 py-3 text-sm text-palette-dark/70">
          Live counts are fetched from the API on load.
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <h3 className="text-palette-dark/70 text-sm font-semibold mb-2">Total Users</h3>
          <p className="text-4xl font-bold text-palette-mauve">{stats.totalUsers}</p>
        </Card>

        <Card>
          <h3 className="text-palette-dark/70 text-sm font-semibold mb-2">Active Users</h3>
          <p className="text-4xl font-bold text-palette-blush">{stats.activeUsers}</p>
        </Card>

        <Card>
          <h3 className="text-palette-dark/70 text-sm font-semibold mb-2">Inactive Users</h3>
          <p className="text-4xl font-bold text-palette-dark">{stats.inactiveUsers}</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <h3 className="text-lg font-bold text-palette-dark mb-2">Patients</h3>
          <p className="text-3xl font-bold text-palette-mauve mb-4">{stats.patients}</p>
          <Link to="/admin/users?role=PATIENT" className="block">
            <Button variant="ghost" className="text-sm w-full">
              View All Patients
            </Button>
          </Link>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-palette-dark mb-2">Therapists</h3>
          <p className="text-3xl font-bold text-green-600 mb-4">{stats.therapists}</p>
          <Link to="/admin/users?role=THERAPIST" className="block">
            <Button variant="ghost" className="text-sm w-full">
              View All Therapists
            </Button>
          </Link>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-palette-dark mb-2">Admins</h3>
          <p className="text-3xl font-bold text-purple-600 mb-4">{stats.admins}</p>
          <Button variant="ghost" className="text-sm w-full">
            View All Admins
          </Button>
        </Card>
      </div>

      <Card>
        <h2 className="text-2xl font-bold text-palette-dark mb-6">System Information</h2>
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-palette-cream/30">
            <span className="text-palette-dark/70">System Version</span>
            <span className="font-semibold text-palette-dark">1.0.0</span>
          </div>
          <div className="flex justify-between py-3 border-b border-palette-cream/30">
            <span className="text-palette-dark/70">Last Updated</span>
            <span className="font-semibold text-palette-dark">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-palette-dark/70">API Status</span>
            <span className="inline-block px-3 py-1 bg-palette-blush/20 text-palette-blush rounded-full text-sm font-medium">
              Connected
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

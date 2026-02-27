import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Button } from '../components/FormElements';
import { Spinner } from '../components/Spinner';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getUsers();
      console.log('Admin Dashboard API Response:', response.data);
      
      // Handle different response structures
      const userData = response.data.result || response.data;
      const users = Array.isArray(userData) ? userData : (userData.users || []);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-palette-dark mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
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

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-palette-dark mb-2">Patients</h3>
          <p className="text-3xl font-bold text-palette-mauve mb-4">{stats.patients}</p>
          <Button variant="ghost" className="text-sm w-full">
            View All Patients
          </Button>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-palette-dark mb-2">Therapists</h3>
          <p className="text-3xl font-bold text-green-600 mb-4">{stats.therapists}</p>
          <Button variant="ghost" className="text-sm w-full">
            View All Therapists
          </Button>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-palette-dark mb-2">Admins</h3>
          <p className="text-3xl font-bold text-purple-600 mb-4">{stats.admins}</p>
          <Button variant="ghost" className="text-sm w-full">
            View All Admins
          </Button>
        </Card>
      </div>

      <Card className="mt-8">
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

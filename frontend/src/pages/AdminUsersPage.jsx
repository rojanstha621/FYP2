import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Button, Select, Input } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      console.log('API Response:', response.data);
      
      // Handle different response structures
      const userData = response.data.result || response.data;
      const userList = Array.isArray(userData) ? userData : (userData.users || []);
      
      setUsers(userList);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(id);
        setSuccess('User deleted successfully');
        await fetchUsers();
        setSelectedUser(null);
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleUpdate = async (id) => {
    try {
      await adminAPI.updateUser(id, editData);
      setSuccess('User updated successfully');
      await fetchUsers();
      setSelectedUser(null);
      setEditData({});
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const filteredUsers = roleFilter
    ? users.filter(u => u.role === roleFilter)
    : users;

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-palette-dark mb-8">User Management</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card className="mb-8">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-palette-dark/80 mb-2">Filter by Role</label>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Users</option>
              <option value="ADMIN">Admin</option>
              <option value="PATIENT">Patient</option>
              <option value="THERAPIST">Therapist</option>
            </Select>
          </div>
          <div>
            <p className="text-sm text-palette-dark/70">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-palette-cream border-b border-palette-cream/40">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-palette-dark/80">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-palette-dark/80">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-palette-dark/80">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-palette-dark/80">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-palette-dark/80">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-palette-cream/30 hover:bg-palette-cream/95">
                <td className="py-3 px-4 text-palette-dark font-medium">
                  {user.first_name} {user.last_name}
                </td>
                <td className="py-3 px-4 text-palette-dark/70">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'ADMIN' ? 'bg-palette-blush text-palette-dark' :
                    user.role === 'THERAPIST' ? 'bg-palette-cream text-palette-dark' :
                    'bg-palette-cream text-palette-dark'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.is_active
                      ? 'bg-palette-blush text-palette-dark'
                      : 'bg-palette-mauve/20 text-palette-dark'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Button
                    variant="ghost"
                    className="text-sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setEditData(user);
                    }}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-palette-dark/70">No users found</p>
        </Card>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <button
              onClick={() => setSelectedUser(null)}
              className="float-right text-2xl font-bold text-palette-dark/60 hover:text-palette-dark"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-palette-dark mb-6 clear-right">
              Edit User
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">First Name</label>
                <Input
                  value={editData.first_name || ''}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Last Name</label>
                <Input
                  value={editData.last_name || ''}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Role</label>
                <Select
                  value={editData.role || ''}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PATIENT">Patient</option>
                  <option value="THERAPIST">Therapist</option>
                </Select>
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Active</label>
                <Select
                  value={editData.is_active ? 'true' : 'false'}
                  onChange={(e) => setEditData({ ...editData, is_active: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleUpdate(selectedUser.id)}
              >
                Save Changes
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(selectedUser.id)}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

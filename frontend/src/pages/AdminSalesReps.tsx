import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersService, type User, type CreateUserData } from '@/services/users';

export function SalesRepsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    username: '',
    password: '',
    role: 'SalesRep',
  });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getList();
      setUsers(data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await usersService.create(formData);
      alert('User created successfully');
      setOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const updateData = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }
    try {
      await usersService.update(editing.id, updateData);
      alert('User updated successfully');
      setOpen(false);
      setEditing(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await usersService.delete(id);
      alert('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      role: 'SalesRep',
    });
  };

  const isPredefinedAdmin = currentUser?.isPredefinedAdmin;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Sales Reps</h2>
        <button
          onClick={() => { setEditing(null); resetForm(); setOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add User
        </button>
      </div>

      {open && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">{editing ? 'Edit' : 'Create'} User</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username *</label>
              <input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            {(!editing || formData.password) && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password {editing ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required={!editing}
                />
              </div>
            )}
            {isPredefinedAdmin && (
              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="SalesRep">SalesRep</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => { setOpen(false); setEditing(null); resetForm(); }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <span className="font-semibold">{user.username}</span>
                <span className="text-sm text-gray-600 ml-2">({user.email})</span>
                <div className="text-sm text-gray-600">
                  Role: {user.role}
                  {user.salesRep && ` - ${user.salesRep.name}`}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(user);
                    setFormData({
                      email: user.email,
                      username: user.username,
                      password: '',
                      role: user.role,
                    });
                    setOpen(true);
                  }}
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface User {
  id: number;
  name: string;
  email: string;
  roles?: { name: string }[];
  created_at: string;
}

const roleColor: Record<string, string> = {
  'Super Admin': 'text-rose-600 bg-rose-50',
  'Editor': 'text-blue-600 bg-blue-50',
  'Staff': 'text-emerald-600 bg-emerald-50',
};

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user: User | null = null) => {
    setError(null);
    setEditingUser(user);
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.roles?.[0]?.name || 'Staff'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Staff'
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      await fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">User Manager</h1>
          <p className="text-[13px] text-muted mt-1">Manage portal accounts and permissions</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
        <input 
          type="text" placeholder="Search users..." value={filter} onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary" 
        />
      </div>

      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-muted">Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-muted">No users found.</td></tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-background transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-primary">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-muted">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2 py-1 ${roleColor[user.roles?.[0]?.name || ''] || 'text-muted bg-gray-50'}`}>
                      {user.roles?.[0]?.name || 'No Role'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(user)} className="text-muted/40 hover:text-primary h-6 w-6 flex items-center justify-center">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="text-muted/40 hover:text-red-500 h-6 w-6 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'New User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-[13px]">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Full Name *</label>
            <input 
              type="text" name="name" required value={formData.name} onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Email Address *</label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Password {editingUser && '(Leave blank to keep)'}</label>
            <input 
              type="password" name="password" required={!editingUser} value={formData.password} onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Role *</label>
            <select 
              name="role" required value={formData.role} onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-background border border-border text-[13px] focus:outline-none focus:border-primary appearance-none"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Editor">Editor</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save User'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManager;

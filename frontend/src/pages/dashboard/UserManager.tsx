import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Users } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import DashboardHeader from '@/components/ui/DashboardHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';

interface User {
  id: number;
  name: string;
  email: string;
  roles?: { name: string }[];
  is_approved: boolean;
  created_at: string;
}

const getRoleVariant = (role: string) => {
  switch (role) {
    case 'Super Admin': return 'destructive';
    case 'Editor': return 'secondary';
    case 'Staff': return 'success';
    default: return 'default';
  }
};

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Editor'
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (debouncedFilter) params.append('search', debouncedFilter);

      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res.data.data);
      setLastPage(res.data.last_page || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedFilter]);

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
      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => setDeleteTarget(id);
  const handleApprove = (id: number) => setApproveTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget}`);
      await fetchUsers();
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await api.post(`/users/${approveTarget}/approve`);
      await fetchUsers();
      toast.success('User approved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve user.');
    } finally {
      setApproveTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader title="User Manager">
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </DashboardHeader>

      <div className="flex justify-end">
        <SearchInput 
          placeholder="Search users by name or email..." 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRowSkeleton columns={4} rows={5} />
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center">
                <EmptyState icon={Users} title="No users found" description="No users match your criteria." className="bg-transparent border-0" />
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0 rounded">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-medium text-primary">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted">{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={getRoleVariant(user.roles?.[0]?.name || '')}>
                      {user.roles?.[0]?.name || 'No Role'}
                    </Badge>
                    {!user.is_approved && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        Pending Approval
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!user.is_approved && (
                      <IconButton icon={CheckCircle} variant="success" onClick={() => handleApprove(user.id)} title="Approve User" />
                    )}
                    <IconButton icon={Edit2} onClick={() => handleOpenModal(user)} title="Edit" />
                    <IconButton icon={Trash2} variant="danger" onClick={() => handleDelete(user.id)} title="Delete" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && lastPage > 1 && (
        <Pagination
          currentPage={page}
          lastPage={lastPage}
          onPageChange={setPage}
        />
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'New User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-[13px] rounded">{error}</div>}
          
          <Input 
            label="Full Name" required name="name" value={formData.name} onChange={handleInputChange}
          />
          
          <Input 
            label="Email Address" type="email" required name="email" value={formData.email} onChange={handleInputChange}
          />

          <Input 
            label="Password" hint={editingUser ? 'Leave blank to keep' : undefined} type="password" required={!editingUser} name="password" value={formData.password} onChange={handleInputChange}
          />

          <Select 
            label="Role" required name="role" 
            value={formData.role} 
            onChange={(val) => handleInputChange({ target: { name: 'role', value: val } } as any)}
            options={[
              { value: "Super Admin", label: "Super Admin" },
              { value: "Editor", label: "Editor" }
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingUser ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
      
      <ConfirmDialog 
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={confirmApprove}
        title="Approve User"
        message="Are you sure you want to approve this user's account?"
        confirmText="Approve"
        isDestructive={false}
      />
    </div>
  );
};

export default UserManager;

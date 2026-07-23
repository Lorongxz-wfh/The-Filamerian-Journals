import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, CheckCircle, Users, Power } from 'lucide-react';
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
  is_disabled: boolean;
  disabled_at?: string | null;
  created_at: string;
}

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().optional(),
  role: z.string().min(1, 'Role is required')
});

type UserFormData = z.infer<typeof userFormSchema>;

const getRoleVariant = (role: string) => {
  switch (role) {
    case 'Super Admin': return 'destructive';
    case 'Admin': return 'secondary';
    default: return 'default';
  }
};

const UserManager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Editor'
    }
  });

  const selectedRole = watch('role');

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

  // URL modal sync
  useEffect(() => {
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');
    if (action === 'new') {
      handleOpenModal(null, false);
    } else if (action === 'edit' && userId && users.length > 0) {
      const target = users.find(u => u.id === Number(userId));
      if (target) {
        handleOpenModal(target, false);
      }
    }
  }, [searchParams, users]);

  const handleOpenModal = (user: User | null = null, updateUrl = true) => {
    setServerError(null);
    setEditingUser(user);

    if (user) {
      if (updateUrl) setSearchParams({ action: 'edit', user_id: String(user.id) });
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.roles?.[0]?.name || 'Staff'
      });
    } else {
      if (updateUrl) setSearchParams({ action: 'new' });
      reset({
        name: '',
        email: '',
        password: '',
        role: 'Staff'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('action');
    newParams.delete('user_id');
    setSearchParams(newParams);
  };

  const onSubmit = async (data: UserFormData) => {
    setServerError(null);
    
    // Validate password for new users
    if (!editingUser && (!data.password || data.password.length < 6)) {
      setServerError('Password must be at least 6 characters for new users.');
      return;
    }

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data);
      } else {
        await api.post('/users', data);
      }
      await fetchUsers();
      handleCloseModal();
      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleDelete = (id: number) => setDeleteTarget(id);
  const handleApprove = (id: number) => setApproveTarget(id);

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('You cannot disable your own account.');
      return;
    }
    try {
      const res = await api.post(`/users/${user.id}/toggle-status`);
      await fetchUsers();
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change user status.');
    }
  };

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
            <TableHead>Role & Status</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
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
            users.map((user) => {
              const isSelf = user.id === currentUser.id;
              return (
                <TableRow key={user.id} className={`group ${user.is_disabled ? 'bg-red-50/20 opacity-75' : ''}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0 rounded">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-primary flex items-center gap-1.5">
                          {user.name}
                          {isSelf && (
                            <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded">You</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={getRoleVariant(user.roles?.[0]?.name || '')}>
                        {user.roles?.[0]?.name || 'No Role'}
                      </Badge>

                      {user.is_disabled ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          Disabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                          Active
                        </Badge>
                      )}

                      {!user.is_approved && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {!user.is_approved && (
                        <IconButton icon={CheckCircle} variant="success" onClick={() => handleApprove(user.id)} title="Approve User" />
                      )}
                      
                      {/* Disable / Enable Button */}
                      <IconButton 
                        icon={Power} 
                        variant={user.is_disabled ? 'success' : 'warning'} 
                        onClick={() => handleToggleStatus(user)} 
                        disabled={isSelf}
                        title={isSelf ? 'Cannot disable self' : user.is_disabled ? 'Enable Account' : 'Disable Account'} 
                      />

                      <IconButton icon={Edit2} onClick={() => handleOpenModal(user)} title="Edit" />

                      {/* Soft Delete Button (Only enabled if user is disabled & not self) */}
                      <IconButton 
                        icon={Trash2} 
                        variant="danger" 
                        onClick={() => handleDelete(user.id)} 
                        disabled={isSelf || !user.is_disabled}
                        title={
                          isSelf 
                            ? 'Cannot delete self' 
                            : !user.is_disabled 
                            ? 'Must disable user before deleting' 
                            : 'Permanently Delete User'
                        } 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
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

      {/* Modal with Zod & React Hook Form */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && handleCloseModal()} title={editingUser ? 'Edit User' : 'New User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <div className="p-3 bg-red-50 text-red-700 text-[13px] rounded">{serverError}</div>}
          
          <Input 
            label="Full Name" 
            required 
            error={errors.name?.message}
            {...register('name')}
          />
          
          <Input 
            label="Email Address" 
            type="email" 
            required 
            error={errors.email?.message}
            {...register('email')}
          />

          <Input 
            label="Password" 
            hint={editingUser ? 'Leave blank to keep current' : undefined} 
            type="password" 
            required={!editingUser} 
            error={errors.password?.message}
            {...register('password')}
          />

          <Select 
            label="Role" 
            required 
            value={selectedRole} 
            onChange={(val) => setValue('role', String(val), { shouldValidate: true })}
            options={[
              { value: "Super Admin", label: "Super Admin" },
              { value: "Admin", label: "Admin" }
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingUser ? 'Save Changes' : 'Create User'}
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

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
import { Skeleton, UsersTableSkeleton } from '@/components/ui/Skeleton';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if ((e.key === 'n' || e.key === 'N') && !isModalOpen) {
        e.preventDefault();
        setServerError(null);
        setEditingUser(null);
        reset({ name: '', email: '', password: '', role: 'Editor' });
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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
      <DashboardHeader title="User Accounts">
        <Button onClick={() => handleOpenModal()} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> User
        </Button>
      </DashboardHeader>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {loading ? (
          <Skeleton className="h-4 w-36 rounded shrink-0 my-0.5" />
        ) : (
          <p className="text-[11px] text-muted shrink-0">
            Showing {users.length > 0 ? Math.min((page - 1) * 10 + 1, users.length) : 0}–{users.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        )}
        <div className="w-full sm:w-auto flex justify-end">
          <SearchInput 
            placeholder="Search users by name or email..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role & Status</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <UsersTableSkeleton rows={5} />
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
                      
                      <IconButton icon={Edit2} onClick={() => handleOpenModal(user)} title="Edit User & Manage Status" />
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
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && handleCloseModal()} title={editingUser ? 'Edit User & Management' : 'New User'}>
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

          {/* Account Status & Danger Zone inside Edit Modal */}
          {editingUser && (() => {
            const isSelf = editingUser.id === currentUser.id;
            const disabledAt = editingUser.disabled_at ? new Date(editingUser.disabled_at) : null;
            const now = new Date();
            const hoursElapsed = disabledAt ? Math.floor((now.getTime() - disabledAt.getTime()) / (1000 * 60 * 60)) : 0;
            const hoursRemaining = Math.max(0, 24 - hoursElapsed);
            const canDeletePermanently = editingUser.is_disabled && hoursRemaining === 0;

            return (
              <div className="pt-4 border-t border-border mt-6 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Account Safety & Status</h4>
                
                {isSelf ? (
                  <p className="text-xs text-muted italic bg-muted/10 p-2.5 rounded border border-border">
                    You cannot disable or delete your own logged-in account.
                  </p>
                ) : (
                  <div className="space-y-3 bg-surface p-3.5 border border-border rounded">
                    {/* Status Toggle Box */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-primary">Account Access</div>
                        <div className="text-[11px] text-muted">
                          {editingUser.is_disabled ? 'Account is currently disabled' : 'Account is active and permitted to login'}
                        </div>
                      </div>

                      {editingUser.is_disabled ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await handleToggleStatus(editingUser);
                            handleCloseModal();
                          }}
                          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs"
                        >
                          <Power className="h-3.5 w-3.5 mr-1" /> Enable Account
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await handleToggleStatus(editingUser);
                            handleCloseModal();
                          }}
                          className="border-amber-600 text-amber-700 hover:bg-amber-50 text-xs"
                        >
                          <Power className="h-3.5 w-3.5 mr-1" /> Disable Account First
                        </Button>
                      )}
                    </div>

                    {/* Permanent Delete Section (Shows when disabled with 24-hour countdown) */}
                    {editingUser.is_disabled && (
                      <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-red-600">Permanent Deletion</div>
                          <div className="text-[11px] text-muted">
                            {canDeletePermanently ? (
                              <span className="text-red-600 font-medium">Safety period complete. Ready for permanent deletion.</span>
                            ) : (
                              <span>24-Hour Safety Period: <strong>{hoursRemaining} hour(s) remaining</strong> before permanent delete unlocks.</span>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={!canDeletePermanently}
                          onClick={() => {
                            handleDelete(editingUser.id);
                            handleCloseModal();
                          }}
                          className="text-xs flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

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
        message="Are you sure you want to remove this user account? Their contributions and activity logs will remain preserved."
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

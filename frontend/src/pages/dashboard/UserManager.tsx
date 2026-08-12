import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, CheckCircle, Users, Power, MoreVertical, Copy, Check, AlertTriangle } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { UsersTableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import DashboardHeader from '@/components/ui/DashboardHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, DataTableFooter } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';

interface User {
  id: number;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  email: string;
  roles?: Array<{ name: string }>;
  is_approved: boolean;
  is_disabled: boolean;
  disabled_at?: string | null;
  created_at: string;
}

const userFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional(),
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
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<number | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ user: any; tempPassword: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

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
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      email: '',
      password: '',
      role: 'Admin'
    }
  });

  const selectedRole = watch('role');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

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
      setTotal(res.data.total || 0);
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
        reset({ first_name: '', middle_name: '', last_name: '', suffix: '', email: '', password: '', role: 'Admin' });
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
    if (action === 'new' && !isModalOpen && !editingUser) {
      handleOpenModal(null, false);
    } else if (action === 'edit' && userId && users.length > 0 && !isModalOpen) {
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
        first_name: user.first_name || user.name?.split(' ')[0] || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
        suffix: user.suffix || '',
        email: user.email,
        password: '',
        role: user.roles?.[0]?.name || 'Admin'
      });
    } else {
      if (updateUrl) setSearchParams({ action: 'new' });
      reset({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        email: '',
        password: '',
        role: 'Admin'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('action');
    newParams.delete('user_id');
    setSearchParams(newParams, { replace: true });
  };

  const onSubmit = async (data: UserFormData) => {
    setServerError(null);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', data);
        toast.success('User account created successfully. Credentials have been emailed to the user.');
      }
      handleCloseModal();
      reset();
      fetchUsers();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to save user.');
    }
  };

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

      <div className="flex flex-col gap-4">
        <div className="flex justify-end items-center">
          <SearchInput 
            placeholder="Search users by name or email..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
          />
        </div>

        <div className="border border-border bg-surface flex flex-col">
        <Table containerClassName="max-h-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role & Status</TableHead>
              <TableHead className="w-12 text-right"></TableHead>
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
                  <TableRow 
                    key={user.id} 
                    className={`group hover:bg-primary/5 cursor-pointer transition-colors ${user.is_disabled ? 'bg-red-50/20 opacity-75' : ''}`}
                    onClick={() => handleOpenModal(user)}
                  >
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
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                      <DropdownMenu
                        trigger={
                          <IconButton icon={MoreVertical} title="Actions" />
                        }
                      >
                        {!user.is_approved && (
                          <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle className="h-4 w-4 text-emerald-600" /> Approve User
                            </div>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                          <div className="flex items-center gap-2 text-foreground">
                            <Edit2 className="h-4 w-4 text-muted" /> Edit & Details
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <DataTableFooter
          currentPage={page}
          lastPage={lastPage}
          onPageChange={setPage}
          showingText={`Showing ${total > 0 ? Math.min((page - 1) * 10 + 1, total) : 0}–${Math.min(page * 10, total)} of ${total} user${total !== 1 ? 's' : ''}`}
          loading={loading}
        />
        </div>
      </div>

      {/* Modal with Zod & React Hook Form */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && handleCloseModal()} title={editingUser ? 'Edit User & Management' : 'New User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <div className="p-3 bg-red-50 text-red-700 text-[13px] rounded">{serverError}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              label="First Name" 
              required 
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input 
              label="Middle Name" 
              hint="Optional"
              error={errors.middle_name?.message}
              {...register('middle_name')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              label="Last Name" 
              required 
              error={errors.last_name?.message}
              {...register('last_name')}
            />
            <Input 
              label="Suffix" 
              hint="Optional"
              placeholder="e.g. Jr., Ph.D."
              error={errors.suffix?.message}
              {...register('suffix')}
            />
          </div>
          
          <Input 
            label="Email Address" 
            type="email" 
            required 
            error={errors.email?.message}
            {...register('email')}
          />

          {!editingUser ? (
            <div className="p-3 bg-primary/5 border border-primary/20 text-xs text-muted space-y-1">
              <span className="font-semibold text-primary block">Automatic Password Generation</span>
              <span>A secure random temporary password will be automatically generated and sent to this email address.</span>
            </div>
          ) : (
            <div className="p-3 bg-background border border-border text-xs text-muted space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">Password Security</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.post('/forgot-password', { email: editingUser.email });
                      toast.success(`Password reset link sent to ${editingUser.email}`);
                    } catch (err: any) {
                      toast.error('Failed to send password reset email.');
                    }
                  }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Send Password Reset Link
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted/80">
                Passwords are not shown or modified directly. Click above to send a secure password reset link to this user's email address.
              </p>
            </div>
          )}

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

      {/* Created Credentials Modal (Single-view password display) */}
      {createdCredentials && (
        <Modal
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          title="Account Created - Temporary Credentials"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-700 mb-0.5">Important Notice</span>
                Please copy or save these account credentials now. For security reasons, temporary passwords are only displayed once upon creation.
              </div>
            </div>

            <div className="space-y-3 bg-background p-4 border border-border">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">User Full Name</label>
                <div className="text-xs font-semibold text-primary">{createdCredentials.user?.name}</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Email Address</label>
                <div className="text-xs font-mono text-primary">{createdCredentials.user?.email}</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Assigned Role</label>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                  {createdCredentials.user?.roles?.[0]?.name || 'Admin'}
                </Badge>
              </div>

              <div className="pt-2 border-t border-border">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Temporary Password</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-surface border border-primary/30 font-mono text-sm font-bold text-primary select-all">
                    {createdCredentials.tempPassword}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.tempPassword);
                      setCopiedPass(true);
                      toast.success('Temporary password copied to clipboard');
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="shrink-0 flex items-center gap-1.5 text-xs py-2"
                  >
                    {copiedPass ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    {copiedPass ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const fullDetails = `Full Name: ${createdCredentials.user?.name}\nEmail: ${createdCredentials.user?.email}\nTemporary Password: ${createdCredentials.tempPassword}`;
                  navigator.clipboard.writeText(fullDetails);
                  toast.success('All credentials copied to clipboard');
                }}
                className="text-xs"
              >
                Copy All Details
              </Button>
              <Button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="text-xs"
              >
                Done & Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

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

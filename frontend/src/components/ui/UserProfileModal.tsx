import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import api from '@/services/api';
import { toast } from 'sonner';
import { User, Lock, AlertCircle } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onProfileUpdated }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setFirstName(storedUser.first_name || storedUser.name?.split(' ')[0] || '');
      setMiddleName(storedUser.middle_name || '');
      setLastName(storedUser.last_name || storedUser.name?.split(' ').slice(1).join(' ') || '');
      setSuffix(storedUser.suffix || '');
      setName(storedUser.name || '');
      setEmail(storedUser.email || '');
      setRole(storedUser.role || storedUser.roles?.[0] || 'Member');
      setProfileError(null);
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    symbol: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileError(null);

    try {
      const res = await api.put('/profile', {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix: suffix,
        email: email,
      });
      const updatedUser = res.data.user;

      // Update local storage user object
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newUserData = {
        ...storedUser,
        name: updatedUser.name,
        first_name: updatedUser.first_name,
        middle_name: updatedUser.middle_name,
        last_name: updatedUser.last_name,
        suffix: updatedUser.suffix,
        email: updatedUser.email
      };
      localStorage.setItem('user', JSON.stringify(newUserData));

      setName(updatedUser.name);
      toast.success('Profile information updated successfully.');
      if (onProfileUpdated) onProfileUpdated(newUserData);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setProfileError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Failed to update profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('Password must meet all 5 complexity requirements below (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol).');
      return;
    }

    setLoadingPassword(true);
    setPasswordError(null);

    try {
      await api.put('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
      setPasswordError(err.response?.data?.message || err.response?.data?.errors?.current_password?.[0] || 'Failed to change password.');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings & Profile">
      <div className="space-y-5">
        {/* User Card Header */}
        <div className="flex items-center gap-4 bg-background p-4 border border-border">
          <div className="h-12 w-12 bg-primary text-secondary flex items-center justify-center font-bold text-lg border border-border">
            {name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-primary truncate text-sm">{name}</h3>
            <p className="text-xs text-muted font-mono truncate">{email}</p>
            <div className="mt-1">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                {role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-primary text-primary bg-surface'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            <User className="h-3.5 w-3.5" /> Personal Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-primary text-primary bg-surface'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            <Lock className="h-3.5 w-3.5" /> Security & Password
          </button>
        </div>

        {/* Tab 1: Profile Info */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-1">
            {profileError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Middle Name"
                hint="Optional"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <Input
                label="Suffix"
                hint="Optional"
                placeholder="e.g. Jr., Ph.D."
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loadingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {/* Password Strength Checklist */}
            {newPassword && (
              <div className="p-3 bg-background border border-border text-xs space-y-1.5 font-mono">
                <div className="font-sans font-bold text-[11px] uppercase tracking-wider text-muted mb-1">
                  Password Requirements:
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.length ? '✓' : '○'}</span> At least 8 characters long
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.uppercase ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.uppercase ? '✓' : '○'}</span> At least 1 uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.lowercase ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.lowercase ? '✓' : '○'}</span> At least 1 lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.number ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.number ? '✓' : '○'}</span> At least 1 number (0-9)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.symbol ? 'text-emerald-600 font-bold' : 'text-muted/60'}`}>
                  <span>{passwordChecks.symbol ? '✓' : '○'}</span> At least 1 special symbol (!@#$%^&*)
                </div>
              </div>
            )}

            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loadingPassword} disabled={!isPasswordValid}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default UserProfileModal;

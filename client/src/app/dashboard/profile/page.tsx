'use client';

import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiLock, FiSave, FiCheckCircle } from 'react-icons/fi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { fetchProfile, updateProfile, changePassword } from '@/services/profile';

// ============================================================
// Profile — Edit personal information & password
// ============================================================

interface ProfileForm {
  name: string;
  phone: string;
  avatar: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialProfile: ProfileForm = { name: '', phone: '', avatar: '' };
const initialPassword: PasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [password, setPassword] = useState<PasswordForm>(initialPassword);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    fetchProfile()
      .then((freshUser) => {
        if (!active) return;
        updateUser(freshUser);
        setProfile({
          name: freshUser.name ?? '',
          phone: freshUser.phone ?? '',
          avatar: freshUser.avatar ?? '',
        });
      })
      .catch(() => {
        // Fall back to the session-cached user if the refresh fails.
        if (!active || !user) return;
        setProfile({ name: user.name ?? '', phone: user.phone ?? '', avatar: user.avatar ?? '' });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validatePassword = () => {
    const errors: Partial<PasswordForm> = {};
    if (!password.currentPassword) errors.currentPassword = 'Enter your current password';
    if (!password.newPassword) errors.newPassword = 'Enter a new password';
    else if (password.newPassword.length < 8) errors.newPassword = 'Must be at least 8 characters';
    if (password.confirmPassword !== password.newPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name.trim().length < 2) {
      setProfileError('Name must be at least 2 characters');
      return;
    }
    setProfileError('');
    setProfileLoading(true);
    try {
      const updated = await updateProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim() || undefined,
        avatar: profile.avatar.trim() || undefined,
      });
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setPasswordSuccess(false);
    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword });
      setPassword(initialPassword);
      setPasswordSuccess(true);
      toast.success('Password changed');
    } catch (err) {
      setPasswordErrors({ currentPassword: err instanceof Error ? err.message : 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout title="Profile" subtitle="Update your personal information and password.">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <form
          onSubmit={handleSaveProfile}
          className="rounded-2xl border border-sage-light/30 bg-white p-6"
          noValidate
        >
          <h2 className="font-display text-2xl font-light text-navy">Personal Information</h2>
          <p className="mt-1 text-sm text-slate">Keep your details up to date so we can serve you better.</p>

          <div className="mt-6 space-y-5">
            <Input
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              leftIcon={<FiUser className="h-4 w-4" />}
              placeholder="Your full name"
              required
            />
            <Input
              label="Email"
              value={user?.email ?? ''}
              disabled
              readOnly
              leftIcon={<FiMail className="h-4 w-4" />}
              helperText="Email address cannot be changed here"
            />
            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              helperText="Used for order updates and delivery contact"
            />
            <Input
              label="Avatar URL"
              type="url"
              name="avatar"
              value={profile.avatar}
              onChange={(e) => setProfile((prev) => ({ ...prev, avatar: e.target.value }))}
              placeholder="https://..."
              helperText="Link to an image for your profile photo"
            />
          </div>

          {profileError && <p className="mt-4 text-xs text-red-500">{profileError}</p>}

          <Button type="submit" variant="walnut" size="md" className="mt-6" isLoading={profileLoading} leftIcon={<FiSave className="h-4 w-4" />}>
            Save Changes
          </Button>
        </form>

        {/* Change Password */}
        <form
          onSubmit={handleChangePassword}
          className="rounded-2xl border border-sage-light/30 bg-white p-6"
          noValidate
        >
          <h2 className="font-display text-2xl font-light text-navy">Change Password</h2>
          <p className="mt-1 text-sm text-slate">Use a strong password you don&apos;t use anywhere else.</p>

          <div className="mt-6 space-y-5">
            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
              value={password.currentPassword}
              onChange={(e) => setPassword((prev) => ({ ...prev, currentPassword: e.target.value }))}
              error={passwordErrors.currentPassword}
              leftIcon={<FiLock className="h-4 w-4" />}
              required
            />
            <Input
              label="New Password"
              type="password"
              name="newPassword"
              value={password.newPassword}
              onChange={(e) => setPassword((prev) => ({ ...prev, newPassword: e.target.value }))}
              error={passwordErrors.newPassword}
              leftIcon={<FiLock className="h-4 w-4" />}
              helperText="At least 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={password.confirmPassword}
              onChange={(e) => setPassword((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              error={passwordErrors.confirmPassword}
              leftIcon={<FiLock className="h-4 w-4" />}
              required
            />
          </div>

          {passwordSuccess && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-sage-dark">
              <FiCheckCircle className="h-4 w-4" />
              Password changed successfully.
            </p>
          )}

          <Button type="submit" variant="walnut" size="md" className="mt-6" isLoading={passwordLoading} leftIcon={<FiLock className="h-4 w-4" />}>
            Update Password
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
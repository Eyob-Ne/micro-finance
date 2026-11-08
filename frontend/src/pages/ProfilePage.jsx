import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Lock,
  Save,
  Loader2,
} from 'lucide-react';
import api from '../api/axios.js';
import { isValidPassword } from '../utils/validators.js';

const ROLE_BADGES = {
  admin: 'bg-purple-100 text-purple-700 ring-purple-200',
  manager: 'bg-blue-100 text-blue-700 ring-blue-200',
  cashier: 'bg-green-100 text-green-700 ring-green-200',
  loan_officer: 'bg-orange-100 text-orange-800 ring-orange-200',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Change password form state
  const [passForm, setPassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setProfile(data.user);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passForm.oldPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (!isValidPassword(passForm.newPassword)) {
      toast.error('Password must be between 6 and 72 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPassForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel = profile?.role ? profile.role.replace('_', ' ') : 'User';
  const roleBadgeStyle = (profile?.role && ROLE_BADGES[profile.role]) || 'bg-gray-100 text-gray-800 ring-gray-200';
  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">User Profile</h1>
        <p className="mt-1 text-sm text-slate-500">View your personal account details and manage security settings.</p>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm">
          <div className="flex animate-pulse items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 rounded bg-slate-200" />
              <div className="h-4 w-36 rounded bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          {/* Gradient Header */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 sm:h-40" />

          <div className="relative px-6 pb-8 sm:px-8">
            {/* Avatar circle */}
            <div className="-mt-16 flex flex-col items-start gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-5">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-600 text-4xl font-extrabold text-white shadow-xl ring-4 ring-white sm:h-32 sm:w-32 sm:text-5xl">
                  {initial}
                </div>
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ring-inset capitalize ${roleBadgeStyle}`}>
                      <Shield className="h-3.5 w-3.5" />
                      {roleLabel}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${profile?.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {profile?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile info fields */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <User className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Full Name</p>
                  <p className="truncate text-sm font-semibold text-slate-900">{profile?.full_name || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Email Address</p>
                  <p className="truncate text-sm font-semibold text-slate-900">{profile?.email || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Calendar className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Member Since</p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500">Ensure your account is using a long and strong password.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-6 max-w-xl space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={passForm.oldPassword}
                onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              />
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              />
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              />
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

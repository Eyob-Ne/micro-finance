import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  UserCog,
  ShieldCheck,
  Mail,
  Trash2,
  X,
  AlertCircle,
  Pencil,
  Users,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Wallet,
  Banknote,
  BarChart3,
} from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isValidEmail, isValidPassword } from '../utils/validators.js';

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 text-sm">
      <span className="text-gray-600">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >Previous</button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >Next</button>
      </div>
    </div>
  );
}

const ROLES = {
  admin: {
    label: 'System admin',
    short: 'Admin',
    badge: 'bg-violet-100 text-violet-700 ring-violet-200',
    tile: 'from-violet-500 to-purple-700',
    desc: 'Full access to every module',
    icon: ShieldCheck,
  },
  manager: {
    label: 'Manager',
    short: 'Manager',
    badge: 'bg-sky-100 text-sky-700 ring-sky-200',
    tile: 'from-sky-500 to-blue-600',
    desc: 'Reviews loans and reads reports',
    icon: BarChart3,
  },
  cashier: {
    label: 'Cashier',
    short: 'Cashier',
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    tile: 'from-emerald-500 to-emerald-700',
    desc: 'Handles repayments and savings',
    icon: Banknote,
  },
  loan_officer: {
    label: 'Loan officer',
    short: 'Loan officer',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    tile: 'from-amber-400 to-orange-500',
    desc: 'Manages clients and loan applications',
    icon: Wallet,
  },
};

const ROLE_ORDER = ['loan_officer', 'cashier', 'manager', 'admin'];

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-700',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-red-600',
  'from-teal-400 to-cyan-600',
];

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'loan_officer',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ full_name: '', email: '', password: '', role: 'loan_officer' });
    setShowPassword(false);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (form.email && !isValidEmail(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!editing) {
      if (!isValidPassword(form.password)) {
        toast.error('Password must be between 6 and 72 characters');
        return;
      }
    } else if (form.password && !isValidPassword(form.password)) {
      toast.error('Password must be between 6 and 72 characters');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        // Update existing user (password is not updated here in the backend)
        await api.put(`/users/${editing.id}`, {
          full_name: form.full_name,
          role: form.role,
          is_active: true, // Reactivate if they were disabled
        });
        toast.success('User updated successfully');
      } else {
        // Create new user
        await api.post('/users', form);
        toast.success('User created successfully');
      }
      setShowForm(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save user');
    }
    setSaving(false);
  };

  const deactivateUser = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/${confirmDel.id}`);
      toast.success('User deactivated successfully');
      setConfirmDel(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate user');
    }
    setSaving(false);
  };

  // Filter users based on search query locally
  const term = debouncedQ.toLowerCase();
  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
  );
  const totalPages = Math.ceil(filteredUsers.length / 10) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * 10, page * 10);

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.length - activeCount;

  const getRoleBadge = (role) => {
    const r = ROLES[role];
    if (!r) return <span className="text-slate-600">{role}</span>;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${r.badge}`}>
        <r.icon className="h-3.5 w-3.5" />
        {r.short}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes users-pop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes users-fade { from { opacity: 0; } to { opacity: 1; } }
        .users-pop { animation: users-pop .22s cubic-bezier(.2,.8,.2,1) both; }
        .users-fade { animation: users-fade .2s ease both; }
        @media (prefers-reduced-motion: reduce) { .users-pop, .users-fade { animation: none; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">System users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage staff access and roles.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:translate-y-0"
        >
          <Plus className="h-4 w-4" /> Add staff member
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total staff', value: users.length, icon: Users, tile: 'from-sky-500 to-blue-600', glow: 'shadow-blue-500/30' },
          { label: 'Active', value: activeCount, icon: UserCheck, tile: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/30' },
          { label: 'Deactivated', value: inactiveCount, icon: UserX, tile: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/30' },
        ].map(({ label, value, icon: Icon, tile, glow }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tile} text-white shadow-lg ${glow}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-10 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          placeholder="Search by name, email, or role..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-5">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <UserCog className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No users found</h3>
                    <p className="mt-1 text-sm text-slate-500">Try a different search or add a new staff member.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => (
                  <tr key={u.id} className={`group transition-colors hover:bg-emerald-50/40 ${!u.is_active ? 'bg-slate-50/60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-3 ${!u.is_active ? 'opacity-60' : ''}`}>
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
                            AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                          } font-bold text-white shadow-md`}
                        >
                          {u.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            {u.full_name}
                            {u.id === currentUser?.id && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">You</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 text-emerald-500" /> {u.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                          title="Edit"
                          aria-label="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {u.id !== currentUser?.id && u.is_active && (
                          <button
                            onClick={() => setConfirmDel(u)}
                            className="rounded-xl bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                            title="Deactivate"
                            aria-label="Deactivate user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ───────── Create / edit modal ───────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="users-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form
            onSubmit={save}
            className="users-pop relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-emerald-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-emerald-950">
                  <UserCog className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{editing ? 'Edit user' : 'Add staff member'}</h3>
                  <p className="text-xs text-emerald-100/80">Fields marked * are required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="rounded-full p-2 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Full name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  className={fieldClass}
                  placeholder="e.g. Abebe Bikila"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email address <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  disabled={!!editing}
                  className={fieldClass}
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {!editing && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Initial password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      minLength={6}
                      className={`${fieldClass} pl-10 pr-12`}
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-sm font-semibold text-slate-700">
                  System role <span className="text-rose-500">*</span>
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ROLE_ORDER.map((key) => {
                    const r = ROLES[key];
                    const selected = form.role === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setForm({ ...form, role: key })}
                        aria-pressed={selected}
                        className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.tile} text-white`}>
                          <r.icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-slate-900">{r.label}</span>
                          <span className="block text-xs text-slate-500">{r.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────── Deactivate confirmation ───────── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="users-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setConfirmDel(null)} />
          <div className="users-pop relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-red-500/30">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Deactivate user</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to deactivate <strong className="text-slate-800">{confirmDel.full_name}</strong>?
            </p>
            <p className="mb-6 mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              They will no longer be able to log in to the system. Their audit history will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={deactivateUser}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
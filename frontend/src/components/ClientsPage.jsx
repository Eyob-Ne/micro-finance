import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Users,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Eye,
  UserCheck,
  UserX,
  UploadCloud,
  ExternalLink,
  AlertTriangle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import api from '../api/axios.js';
import { isValidPhone, isValidEmail, isValidNationalId, isAtLeast18 } from '../utils/validators.js';

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

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  national_id: '',
  address: '',
  dob: '',
  gender: 'male',
};

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-700',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-red-600',
  'from-teal-400 to-cyan-600',
];

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function FilePick({ label, hint, accept, file, onChange }) {
  return (
    <label className="group flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center transition hover:border-emerald-400 hover:bg-emerald-50/60">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
        <UploadCloud className="h-5 w-5" />
      </span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="max-w-full truncate text-xs text-slate-500">{file ? file.name : hint}</span>
      <input type="file" accept={accept} className="hidden" onChange={onChange} />
    </label>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmReactivate, setConfirmReactivate] = useState(null);

  // KYC Preview State
  const [viewKyc, setViewKyc] = useState(null);

  // Form State
  const [form, setForm] = useState(EMPTY_FORM);
  const [kycFiles, setKycFiles] = useState({ kyc_id: null, kyc_photo: null });

  const load = async (pageNum = page, term = q) => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients', { params: { search: term, page: pageNum, limit } });
      setClients(data.clients || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      toast.error('Failed to load clients');
    }
    setLoading(false);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    load(newPage, q);
  };

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      load(1, q);
    }, 400);
    return () => clearTimeout(timer);
  }, [q]); // eslint-disable-line

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setKycFiles({ kyc_id: null, kyc_photo: null });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      phone: c.phone || '',
      email: c.email || '',
      national_id: c.national_id || '',
      address: c.address || '',
      dob: c.dob ? c.dob.split('T')[0] : '',
      gender: c.gender || 'male',
    });
    setKycFiles({ kyc_id: null, kyc_photo: null });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.national_id || !isValidNationalId(form.national_id)) {
      toast.error('National ID must be 5-30 characters (letters, numbers, dashes)');
      return;
    }

    if (form.phone && !isValidPhone(form.phone)) {
      toast.error('Please enter a valid Ethiopian phone number (e.g. 0911234567)');
      return;
    }

    if (form.email && !isValidEmail(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (form.dob && !isAtLeast18(form.dob)) {
      toast.error('Client must be at least 18 years old');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) formData.append(key, form[key]);
      });
      if (kycFiles.kyc_id) formData.append('kyc_id', kycFiles.kyc_id);
      if (kycFiles.kyc_photo) formData.append('kyc_photo', kycFiles.kyc_photo);

      if (editing) {
        await api.put(`/clients/${editing.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/clients', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      toast.success(editing ? 'Client updated successfully' : 'Client created successfully');
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save client');
    }
    setSaving(false);
  };

  const del = async () => {
    setSaving(true);
    try {
      await api.delete(`/clients/${confirmDel.id}`);
      toast.success('Client deactivated successfully');
      setConfirmDel(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete client');
    }
    setSaving(false);
  };

  const reactivate = async () => {
    setSaving(true);
    try {
      await api.put(`/clients/${confirmReactivate.id}/reactivate`);
      toast.success('Client reactivated successfully');
      setConfirmReactivate(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reactivate client');
    }
    setSaving(false);
  };

  const clearSearch = () => {
    setQ('');
    setPage(1);
    load(1, '');
  };

  const activeCount = clients.filter((c) => c.is_active).length;
  const inactiveCount = clients.length - activeCount;

  const isPdf = (url) => /\.pdf(\?.*)?$/i.test(url || '');

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes clients-pop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes clients-fade { from { opacity: 0; } to { opacity: 1; } }
        .clients-pop { animation: clients-pop .22s cubic-bezier(.2,.8,.2,1) both; }
        .clients-fade { animation: clients-fade .2s ease both; }
        @media (prefers-reduced-motion: reduce) { .clients-pop, .clients-fade { animation: none; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Clients directory</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all registered microfinance clients.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:translate-y-0"
        >
          <Plus className="h-4 w-4" /> Add new client
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Clients listed', value: clients.length, icon: Users, tile: 'from-sky-500 to-blue-600', glow: 'shadow-blue-500/30' },
          { label: 'Active', value: activeCount, icon: UserCheck, tile: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/30' },
          { label: 'Inactive', value: inactiveCount, icon: UserX, tile: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/30' },
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-10 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            placeholder="Search by name, phone, or ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
        >
          <Search className="h-4 w-4" /> Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">National ID</th>
                <th className="px-6 py-4">KYC documents</th>
                <th className="px-6 py-4">Savings</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-5">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No clients found</h3>
                    <p className="mb-5 mt-1 text-sm text-slate-500">Register a new client to get started.</p>
                    <button
                      onClick={openCreate}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" /> Add client
                    </button>
                  </td>
                </tr>
              ) : (
                clients.map((c, idx) => (
                  <tr key={c.id} className="group transition-colors hover:bg-emerald-50/40">
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-3 ${!c.is_active ? 'opacity-60' : ''}`}>
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
                            AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
                          } font-bold text-white shadow-md`}
                        >
                          {c.first_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            <Link to={`/clients/${c.id}`} className="hover:text-primary-600">
                              {c.first_name} {c.last_name}
                            </Link>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <span className="capitalize">{c.gender}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {c.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-emerald-500" /> {c.phone || 'N/A'}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-slate-400" /> {c.email || '—'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" /> {c.national_id || 'N/A'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {c.kyc_id_url ? (
                          <button
                            onClick={() => setViewKyc({ url: c.kyc_id_url, label: 'National ID', client: c })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-600 hover:text-white"
                            title="View ID document"
                          >
                            <FileText className="h-3.5 w-3.5" /> ID
                          </button>
                        ) : (
                          <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-400">No ID</span>
                        )}

                        {c.kyc_photo_url ? (
                          <button
                            onClick={() => setViewKyc({ url: c.kyc_photo_url, label: 'KYC Photo', client: c })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-100 transition hover:bg-violet-600 hover:text-white"
                            title="View photo"
                          >
                            <Eye className="h-3.5 w-3.5" /> Photo
                          </button>
                        ) : (
                          <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-400">No photo</span>
                        )}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-bold text-emerald-700">
                      ETB {Number(c.savings_balance || 0).toLocaleString()}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex gap-1.5 transition lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                        {c.is_active ? (
                          <>
                            <button
                              onClick={() => openEdit(c)}
                              className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                              title="Edit"
                              aria-label="Edit client"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDel(c)}
                              className="rounded-xl bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                              title="Deactivate"
                              aria-label="Deactivate client"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmReactivate(c)}
                            className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                            title="Reactivate client"
                            aria-label="Reactivate client"
                          >
                            <RotateCcw className="h-4 w-4" />
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
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      {/* ───────── KYC preview modal ───────── */}
      {viewKyc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="clients-fade absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setViewKyc(null)} />
          <div className="clients-pop relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-emerald-700 px-6 py-4 text-white">
              <div>
                <h3 className="font-bold">{viewKyc.label}</h3>
                <p className="text-xs text-emerald-100/80">
                  {viewKyc.client.first_name} {viewKyc.client.last_name} &middot; {viewKyc.client.national_id}
                </p>
              </div>
              <button
                onClick={() => setViewKyc(null)}
                aria-label="Close preview"
                className="rounded-full p-2 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 justify-center overflow-auto bg-slate-100 p-4">
              {isPdf(viewKyc.url) ? (
                <iframe src={viewKyc.url} className="h-[70vh] w-full rounded-xl" title="KYC Document" />
              ) : (
                <img src={viewKyc.url} alt={viewKyc.label} className="max-h-[70vh] rounded-xl object-contain shadow-lg" />
              )}
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-white px-6 py-3">
              <a
                href={viewKyc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
              >
                Open in new tab <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Create / edit modal ───────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="clients-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form
            onSubmit={save}
            className="clients-pop relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 to-emerald-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-emerald-950">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{editing ? 'Edit client' : 'Register client'}</h3>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name" required>
                  <input required className={fieldClass} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </Field>
                <Field label="Last name" required>
                  <input required className={fieldClass} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  <input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Email">
                  <input type="email" className={fieldClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="National ID" required>
                  <input required className={fieldClass} value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
                </Field>
                <Field label="Date of birth">
                  <input type="date" className={fieldClass} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </Field>
                <Field label="Gender">
                  <select className={fieldClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>

              <Field label="Address">
                <input className={fieldClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>

              <div className="border-t border-slate-100 pt-5">
                <p className="mb-3 text-sm font-semibold text-slate-700">KYC documents</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FilePick
                    label="ID document"
                    hint="Image or PDF"
                    accept="image/*,.pdf"
                    file={kycFiles.kyc_id}
                    onChange={(e) => setKycFiles({ ...kycFiles, kyc_id: e.target.files[0] })}
                  />
                  <FilePick
                    label="Client photo"
                    hint="Image only"
                    accept="image/*"
                    file={kycFiles.kyc_photo}
                    onChange={(e) => setKycFiles({ ...kycFiles, kyc_photo: e.target.files[0] })}
                  />
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
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────── Deactivate modal ───────── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="clients-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setConfirmDel(null)} />
          <div className="clients-pop relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-red-500/30">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Deactivate client</h3>
            <p className="mb-6 mt-2 text-sm text-slate-500">
              Are you sure you want to deactivate{' '}
              <strong className="text-slate-800">
                {confirmDel.first_name} {confirmDel.last_name}
              </strong>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={del}
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

      {/* ───────── Reactivate modal ───────── */}
      {confirmReactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="clients-fade absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setConfirmReactivate(null)} />
          <div className="clients-pop relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
              <RotateCcw className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Reactivate client</h3>
            <p className="mb-6 mt-2 text-sm text-slate-500">
              Are you sure you want to reactivate{' '}
              <strong className="text-slate-800">
                {confirmReactivate.first_name} {confirmReactivate.last_name}
              </strong>
              ? They will be able to apply for loans and access services again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReactivate(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={reactivate}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Reactivating...' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
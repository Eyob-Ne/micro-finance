import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Wallet,
  FileText,
  Eye,
  Calendar,
  X,
  User,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import api from '../../api/axios.js';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-sky-100 text-sky-800 ring-sky-200',
  disbursed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-700 ring-slate-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
};

const isPdf = (url) => /\.pdf(\?.*)?$/i.test(url || '');

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState(null);

  // KYC modal viewer state
  const [viewDoc, setViewDoc] = useState(null); // { title: string, url: string }

  useEffect(() => {
    let isMounted = true;
    const fetchClient = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/clients/${id}`);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 404) {
            setNotFound(true);
          } else {
            toast.error(err.response?.data?.error || 'Failed to load client details');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClient();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-7xl py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Client not found</h2>
        <p className="mt-2 text-sm text-slate-500">The client you are looking for does not exist or has been removed.</p>
        <Link
          to="/clients"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Link>
      </div>
    );
  }

  const client = data?.client;
  const savings = data?.savings_account;
  const loans = data?.active_loans || [];
  const initial = client?.first_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
            <div className="h-44 animate-pulse rounded-3xl bg-slate-200 md:col-span-2" />
          </div>
        </div>
      ) : (
        <>
          {/* Header Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900" />
            <div className="relative px-6 pb-6 pt-0 sm:px-8">
              <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-600 text-3xl font-extrabold text-white shadow-xl ring-4 ring-white">
                    {initial}
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                      {client?.first_name} {client?.last_name}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        National ID: {client?.national_id || '—'}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold capitalize text-emerald-700">
                        {client?.gender || '—'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 font-semibold ${
                          client?.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {client?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Bio Details */}
              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="truncate text-sm font-semibold text-slate-900">{client?.phone || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="truncate text-sm font-semibold text-slate-900">{client?.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="truncate text-sm font-semibold text-slate-900">{client?.address || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Date of Birth</p>
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {client?.dob ? new Date(client.dob).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column: KYC Documents & Savings Card */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* KYC Section */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">KYC Documents</h2>
              <p className="text-xs text-slate-500">Verified identification and photo</p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={!client?.kyc_id_url}
                  onClick={() =>
                    setViewDoc({
                      title: 'National ID / Passport',
                      url: client.kyc_id_url,
                    })
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-100 disabled:hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">View ID</p>
                      <p className="text-xs text-slate-500">
                        {client?.kyc_id_url ? 'Document on record' : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  disabled={!client?.kyc_photo_url}
                  onClick={() =>
                    setViewDoc({
                      title: 'Client Photo',
                      url: client.kyc_photo_url,
                    })
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-100 disabled:hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                      <Eye className="h-5 w-5" />
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">View Photo</p>
                      <p className="text-xs text-slate-500">
                        {client?.kyc_photo_url ? 'Photo on record' : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Savings Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Savings Account</h2>
                  <p className="text-xs text-slate-500">Account balance and transactions</p>
                </div>
                <Link
                  to="/savings"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                >
                  <Wallet className="h-3.5 w-3.5" /> Go to Savings
                </Link>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800">Current Balance</span>
                  <div className="mt-1 text-3xl font-extrabold text-emerald-950">
                    ETB {Number(savings?.balance || 0).toLocaleString()}
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">
                    Account ID: #{savings?.id || '—'} &middot; Opened{' '}
                    {savings?.created_at ? new Date(savings.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
                <Link
                  to="/savings"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
                >
                  Deposit / Withdraw
                </Link>
              </div>
            </div>
          </div>

          {/* Active Loans Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Active Loans</h2>
                <p className="text-xs text-slate-500">Loans currently ongoing or pending</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {loans.length} active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Loan ID</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4 text-right">Principal</th>
                    <th className="px-6 py-4 text-right">Total Repayable</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">No active loans</p>
                        <p className="text-xs text-slate-400">This client has no pending or active loans.</p>
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr
                        key={loan.id}
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="cursor-pointer transition hover:bg-emerald-50/40"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-900">
                          #{loan.id}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">
                          {loan.product_name || 'Standard'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                          ETB {Number(loan.principal).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">
                          ETB {Number(loan.total_repayable).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset capitalize ${
                              STATUS_BADGES[loan.status] || 'bg-slate-100 text-slate-700 ring-slate-200'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-slate-500">
                          {loan.applied_at ? new Date(loan.applied_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* KYC Modal Viewer */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setViewDoc(null)}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-900">{viewDoc.title}</h3>
              <button
                type="button"
                onClick={() => setViewDoc(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
              {isPdf(viewDoc.url) ? (
                <iframe
                  src={viewDoc.url}
                  className="h-[65vh] w-full rounded-xl"
                  title={viewDoc.title}
                />
              ) : (
                <img
                  src={viewDoc.url}
                  alt={viewDoc.title}
                  className="max-h-[65vh] rounded-xl object-contain shadow-md"
                />
              )}
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-white px-6 py-3">
              <button
                type="button"
                onClick={() => setViewDoc(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

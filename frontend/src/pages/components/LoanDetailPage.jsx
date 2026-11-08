import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Check,
  X,
  Banknote,
  FileText,
  DollarSign,
  User,
  Calendar,
  Percent,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-sky-100 text-sky-800 ring-sky-200',
  disbursed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-700 ring-slate-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
};

const SCHEDULE_STATUS_BADGES = {
  pending: 'bg-slate-100 text-slate-700 ring-slate-200',
  partial: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  paid: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  overdue: 'bg-rose-100 text-rose-800 ring-rose-200',
};

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoan = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.get(`/loans/${id}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(err.response?.data?.error || 'Failed to load loan details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [id]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await api.put(`/loans/${id}/${action}`);
      toast.success(`Loan ${action}d successfully`);
      fetchLoan();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} loan`);
    } finally {
      setActionLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-7xl py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Loan not found</h2>
        <p className="mt-2 text-sm text-slate-500">The loan you requested does not exist or has been removed.</p>
        <Link
          to="/loans"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Loans
        </Link>
      </div>
    );
  }

  const loan = data?.loan;
  const schedules = data?.schedules || [];
  const repayments = data?.repayments || [];

  const role = user?.role;
  const canReview = ['admin', 'manager'].includes(role) && loan?.status === 'pending';
  const canDisburse = ['admin', 'cashier'].includes(role) && loan?.status === 'approved';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top back button & Action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Action buttons at top */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canReview && (
            <>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('approve')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve Loan
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('reject')}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-600 hover:text-white disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Reject Loan
              </button>
            </>
          )}

          {canDisburse && (
            <button
              disabled={actionLoading}
              onClick={() => handleAction('disburse')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/20 transition hover:shadow-lg disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
              Disburse Funds
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      ) : (
        <>
          {/* Header Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1 font-mono text-sm font-bold text-emerald-800">
                    <FileText className="h-4 w-4" /> Loan #{loan?.id}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    Product: <strong className="text-slate-900">{loan?.product_name || 'Standard'}</strong>
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Client:{' '}
                  <Link
                    to={`/clients/${loan?.client_id}`}
                    className="text-emerald-700 hover:underline"
                  >
                    {loan?.first_name} {loan?.last_name}
                  </Link>
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  National ID: {loan?.national_id || '—'} &middot; Phone: {loan?.phone || '—'} &middot; Applied on{' '}
                  {loan?.applied_at ? new Date(loan.applied_at).toLocaleDateString() : '—'}
                </p>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span
                  className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-inset capitalize ${
                    STATUS_BADGES[loan?.status] || 'bg-slate-100 text-slate-700 ring-slate-200'
                  }`}
                >
                  Status: {loan?.status}
                </span>
                {loan?.approved_by_name && (
                  <span className="text-xs text-slate-500">Approved by: {loan.approved_by_name}</span>
                )}
                {loan?.disbursed_by_name && (
                  <span className="text-xs text-slate-500">Disbursed by: {loan.disbursed_by_name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Summary cards: Grid of 4 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <DollarSign className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">Principal</span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                ETB {Number(loan?.principal || 0).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Percent className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">Interest</span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                ETB {Number(loan?.interest_amount || 0).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Banknote className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">Total Repayable</span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-emerald-700">
                ETB {Number(loan?.total_repayable || 0).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Clock className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">Current Status</span>
              </div>
              <div className="mt-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset capitalize ${
                    STATUS_BADGES[loan?.status] || 'bg-slate-100 text-slate-700 ring-slate-200'
                  }`}
                >
                  {loan?.status}
                </span>
              </div>
            </div>
          </div>

          {/* Repayment Schedule Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Repayment Schedule</h2>
                <p className="text-xs text-slate-500">Scheduled monthly installment dues</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {schedules.length} installments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Principal Due</th>
                    <th className="px-6 py-4 text-right">Interest Due</th>
                    <th className="px-6 py-4 text-right">Total Due</th>
                    <th className="px-6 py-4 text-right">Penalty</th>
                    <th className="px-6 py-4 text-right">Amount Paid</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No repayment schedule generated for this loan yet.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((s) => {
                      const hasPenalty = Number(s.penalty_accrued || 0) > 0;
                      return (
                        <tr key={s.id || s.installment_no} className="transition hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-slate-900">
                            #{s.installment_no}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {s.due_date ? new Date(s.due_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-slate-800">
                            ETB {Number(s.principal_due || 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-slate-800">
                            ETB {Number(s.interest_due || 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                            ETB {Number(s.total_due || 0).toLocaleString()}
                          </td>
                          <td
                            className={`whitespace-nowrap px-6 py-4 text-right font-semibold ${
                              hasPenalty ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            ETB {Number(s.penalty_accrued || 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-emerald-700">
                            ETB {Number(s.amount_paid || 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset capitalize ${
                                SCHEDULE_STATUS_BADGES[s.status] || 'bg-slate-100 text-slate-700 ring-slate-200'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments Made Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Payments Made</h2>
                <p className="text-xs text-slate-500">History of recorded loan repayments</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {repayments.length} payments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Payment Method</th>
                    <th className="px-6 py-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No repayments have been recorded for this loan yet.
                      </td>
                    </tr>
                  ) : (
                    repayments.map((r) => (
                      <tr key={r.id} className="transition hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-emerald-700">
                          ETB {Number(r.amount || 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                            {r.payment_method?.replace('_', ' ') || 'cash'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {r.received_by_name || (r.received_by ? `User #${r.received_by}` : 'System')}
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
    </div>
  );
}

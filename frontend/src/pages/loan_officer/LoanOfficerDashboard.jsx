import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Users,
  Wallet,
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

function StatCard({ label, value, Icon, toneClass, iconBgClass, loading }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBgClass} text-white shadow-md`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-1.5 h-8 w-16 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className={`text-2xl font-extrabold tracking-tight ${toneClass}`}>{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoanOfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [myLoans, setMyLoans] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [dashRes, loansRes] = await Promise.all([
          api.get('/reports/dashboard').catch(() => ({ data: {} })),
          api.get('/loans').catch(() => ({ data: { loans: [] } })),
        ]);

        if (!isMounted) return;

        setDashboardData(dashRes.data || {});
        const allLoans = loansRes.data?.loans || [];
        const originated = allLoans.filter((l) => l.applied_by === user?.id);
        setMyLoans(originated);
      } catch (err) {
        console.error('Error fetching loan officer dashboard data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const originatedCount = myLoans.length;
  const disbursedCount = myLoans.filter((l) => ['disbursed', 'closed'].includes(l.status)).length;
  const pendingCount = myLoans.filter((l) => l.status === 'pending').length;
  const rejectedCount = myLoans.filter((l) => l.status === 'rejected').length;

  // Latest 5 applications sorted by date/id descending
  const recentLoans = [...myLoans]
    .sort((a, b) => new Date(b.applied_at || b.created_at || 0) - new Date(a.applied_at || a.created_at || 0))
    .slice(0, 5);

  const firstName = (user?.full_name || 'Loan Officer').split(' ')[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here is an overview of the loans you have originated and recent applications.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Originated Loans"
          value={originatedCount}
          Icon={FileText}
          toneClass="text-slate-900"
          iconBgClass="bg-gradient-to-br from-blue-500 to-indigo-600"
          loading={loading}
        />
        <StatCard
          label="My Disbursed"
          value={disbursedCount}
          Icon={CheckCircle}
          toneClass="text-emerald-700"
          iconBgClass="bg-gradient-to-br from-emerald-500 to-teal-600"
          loading={loading}
        />
        <StatCard
          label="My Pending"
          value={pendingCount}
          Icon={Clock}
          toneClass="text-amber-700"
          iconBgClass="bg-gradient-to-br from-amber-400 to-orange-500"
          loading={loading}
        />
        <StatCard
          label="My Rejected"
          value={rejectedCount}
          Icon={XCircle}
          toneClass="text-rose-700"
          iconBgClass="bg-gradient-to-br from-rose-500 to-red-600"
          loading={loading}
        />
      </div>

      {/* Main Grid: Left = Table, Right = Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-900">My Recent Applications</h2>
              <Link
                to="/loans"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all loans &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Client Name</th>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5 text-right">Principal</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-200" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-slate-200" /></td>
                        <td className="px-6 py-4 text-right"><div className="ml-auto h-4 w-20 rounded bg-slate-200" /></td>
                        <td className="px-6 py-4 text-center"><div className="mx-auto h-4 w-16 rounded bg-slate-200" /></td>
                        <td className="px-6 py-4 text-right"><div className="ml-auto h-4 w-20 rounded bg-slate-200" /></td>
                      </tr>
                    ))
                  ) : recentLoans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">No loan applications originated yet</p>
                        <p className="mt-1 text-xs text-slate-500">Start by submitting your first application.</p>
                        <button
                          onClick={() => navigate('/loans')}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-700"
                        >
                          <Wallet className="h-3.5 w-3.5" /> New Application
                        </button>
                      </td>
                    </tr>
                  ) : (
                    recentLoans.map((loan) => (
                      <tr key={loan.id} className="transition hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                          {loan.first_name} {loan.last_name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {loan.product_name || '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                          ETB {Number(loan.principal || 0).toLocaleString()}
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
                          {loan.applied_at || loan.created_at
                            ? new Date(loan.applied_at || loan.created_at).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: 3 Quick Action Cards */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500">Fast access to frequent tasks</p>

            <div className="mt-5 space-y-3">
              <Link
                to="/clients"
                className="group flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-emerald-50/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Register Client</p>
                    <p className="text-xs text-slate-500">Add new microfinance borrower</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
              </Link>

              <Link
                to="/loans"
                className="group flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-orange-50/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 transition group-hover:bg-orange-600 group-hover:text-white">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">New Loan Application</p>
                    <p className="text-xs text-slate-500">Apply loan on behalf of client</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-700" />
              </Link>

              <Link
                to="/repayments"
                className="group flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-amber-50/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 transition group-hover:bg-amber-600 group-hover:text-white">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">View Repayments</p>
                    <p className="text-xs text-slate-500">Check collections & overdue list</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-700" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

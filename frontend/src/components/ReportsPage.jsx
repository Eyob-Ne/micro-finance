import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calendar,
  RefreshCw,
  BarChart3,
  PiggyBank,
  Clock,
  CalendarClock,
  Trophy,
  Download,
} from 'lucide-react';
import api from '../api/axios.js';

function downloadCSV(rows, filename = 'report.csv') {
  if (!rows || rows.length === 0) {
    toast.error('No data available to export');
    return;
  }
  const headers = Object.keys(rows[0]);
  const escapeField = (val) => {
    if (val === null || val === undefined) return '""';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    // Strip any accidental newlines from CSV-friendly output
    str = str.replace(/\r?\n/g, ' ');
    if (str.includes(',') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeField).join(',');
  const rowLines = rows.map((row) =>
    headers.map((key) => escapeField(row[key])).join(',')
  );

  const csvContent = [headerLine, ...rowLines].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const COLORS = ['#059669', '#f59e0b', '#0ea5e9', '#e11d48', '#7c3aed', '#64748b'];

const TONES = {
  green: { tile: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/30', soft: 'bg-emerald-50' },
  blue: { tile: 'from-sky-500 to-blue-600', glow: 'shadow-blue-500/30', soft: 'bg-sky-50' },
  purple: { tile: 'from-violet-500 to-purple-700', glow: 'shadow-purple-500/30', soft: 'bg-violet-50' },
  red: { tile: 'from-rose-500 to-red-600', glow: 'shadow-red-500/30', soft: 'bg-rose-50' },
  amber: { tile: 'from-amber-400 to-orange-500', glow: 'shadow-orange-500/30', soft: 'bg-amber-50' },
};

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -10px rgba(15,23,42,.25)',
  fontSize: 13,
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // State for all reports
  const [dashboard, setDashboard] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [collections, setCollections] = useState(null);
  const [performance, setPerformance] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const { data } = await api.get('/reports/dashboard');
        setDashboard(data);
      } else if (activeTab === 'portfolio') {
        const { data } = await api.get('/reports/portfolio');
        setPortfolio(data);
      } else if (activeTab === 'schedule') {
        const { data } = await api.get('/reports/schedule');
        setSchedule(data);
      } else if (activeTab === 'collections') {
        const { data } = await api.get('/reports/collections');
        setCollections(data);
      } else if (activeTab === 'performance') {
        const { data } = await api.get('/reports/officer-performance');
        setPerformance(data);
      }
    } catch (error) {
      toast.error(`Failed to load ${activeTab} report`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]); // eslint-disable-line

  const formatCurrency = (val) => `ETB ${Number(val || 0).toLocaleString()}`;

  // Better money shortener: 1.5M, 12k, etc.
  const shortMoney = (val) => {
    const n = Number(val) || 0;
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `ETB ${(n / 1_000).toFixed(0)}k`;
    return `ETB ${n}`;
  };

  const tabs = [
    { id: 'dashboard', label: 'Executive summary', icon: TrendingUp },
    { id: 'portfolio', label: 'Loan portfolio', icon: Wallet },
    { id: 'collections', label: 'Collections', icon: BarChart3 },
    { id: 'schedule', label: 'Schedule due', icon: Calendar },
    { id: 'performance', label: 'Staff performance', icon: Users },
  ];

  const maxPrincipal = Math.max(
    1,
    ...(performance?.officers || []).map((o) => Number(o.total_disbursed_principal || 0))
  );

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes rpt-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .rpt-rise { animation: rpt-rise .35s cubic-bezier(.2,.8,.2,1) both; }
        .rpt-noscroll { scrollbar-width: none; }
        .rpt-noscroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .rpt-rise { animation: none; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Financial reports</h1>
          <p className="mt-1 text-sm text-slate-500">Analyze portfolio health, collections, and staff performance.</p>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="rpt-noscroll max-w-full overflow-x-auto">
        <div className="inline-flex gap-1 rounded-2xl bg-slate-200/70 p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id ? 'bg-white text-emerald-800 shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white py-24 text-slate-500 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
          </div>
          <p className="font-medium">Generating report data...</p>
        </div>
      ) : (
        <div key={activeTab} className="rpt-rise">
          {/* ───────── TAB 1: EXECUTIVE SUMMARY ───────── */}
          {activeTab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Executive summary</h2>
                <button
                  onClick={() => downloadCSV([dashboard], 'executive_summary_report.csv')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total disbursed" value={formatCurrency(dashboard.total_disbursed_amount)} icon={Wallet} tone="green" />
                <StatCard title="Total collected" value={formatCurrency(dashboard.total_repayments_collected)} icon={TrendingUp} tone="blue" />
                <StatCard title="Total overdue" value={formatCurrency(dashboard.total_overdue_amount)} icon={AlertTriangle} tone="red" />
                <StatCard title="Active clients" value={dashboard.active_clients} icon={Users} tone="purple" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoCard
                  icon={PiggyBank}
                  tone="purple"
                  label="Total savings pool"
                  value={formatCurrency(dashboard.total_savings_balance)}
                  note={`${dashboard.total_savings_accounts} active accounts`}
                />
                <InfoCard
                  icon={FileText}
                  tone="green"
                  label="Active loans"
                  value={dashboard.active_loans_count}
                  note={`Out of ${dashboard.total_loans_count} total loans`}
                />
                <InfoCard
                  icon={AlertTriangle}
                  tone="red"
                  label="Overdue loans"
                  value={dashboard.overdue_loans_count}
                  note="Requires immediate attention"
                  valueClass="text-rose-600"
                />
              </div>
            </div>
          )}

          {/* ───────── TAB 2: LOAN PORTFOLIO ───────── */}
          {activeTab === 'portfolio' && portfolio && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Loan portfolio</h2>
                <button
                  onClick={() => downloadCSV(portfolio.by_product || [], 'loan_portfolio_report.csv')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Loans by status" subtitle="How many loans are in each stage">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolio.by_status}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {portfolio.by_status.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} loans`, 'Count']} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Portfolio by product" subtitle="Total principal per loan product">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={portfolio.by_product} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tickFormatter={shortMoney} stroke="#94a3b8" fontSize={12} />
                      <YAxis dataKey="product_name" type="category" width={100} fontSize={12} stroke="#94a3b8" />
                      <RechartsTooltip
                        contentStyle={tooltipStyle}
                        cursor={{ fill: 'rgba(5,150,105,.06)' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Bar dataKey="total_principal" fill="#059669" radius={[0, 8, 8, 0]}>
                        {portfolio.by_product.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>
          )}

          {/* ───────── TAB 3: COLLECTIONS ───────── */}
          {activeTab === 'collections' && collections && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Collections</h2>
                <button
                  onClick={() => downloadCSV(collections.daily_trend || [], 'daily_collections_report.csv')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard title="Collected today" value={formatCurrency(collections.summary.today.total)} icon={ArrowDownRight} tone="green" />
                <StatCard title="This week" value={formatCurrency(collections.summary.this_week.total)} icon={TrendingUp} tone="blue" />
                <StatCard title="This month" value={formatCurrency(collections.summary.this_month.total)} icon={ArrowUpRight} tone="purple" />
              </div>

              <ChartCard title="Daily collection trend" subtitle="Last 14 days" tall>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={collections.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tickFormatter={shortMoney} stroke="#94a3b8" fontSize={12} />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => new Date(label).toDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* ───────── TAB 4: SCHEDULE DUE ───────── */}
          {activeTab === 'schedule' && schedule && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Schedule due</h2>
                <button
                  onClick={() => downloadCSV(schedule.overdue?.items || [], 'overdue_schedule_report.csv')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ScheduleCard label="Overdue" icon={AlertTriangle} tone="red" data={schedule.overdue} formatCurrency={formatCurrency} />
                <ScheduleCard label="Due today" icon={Clock} tone="amber" data={schedule.due_today} formatCurrency={formatCurrency} />
                <ScheduleCard label="Upcoming (7 days)" icon={CalendarClock} tone="blue" data={schedule.upcoming_7_days} formatCurrency={formatCurrency} />
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-red-500/30">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-rose-900">Critical overdue loans</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Due date</th>
                        <th className="px-6 py-4 text-right">Amount due</th>
                        <th className="px-6 py-4 text-right">Days overdue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedule.overdue.items.slice(0, 10).map((item) => (
                        <tr key={item.id} className="transition-colors hover:bg-rose-50/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-sm font-bold text-white">
                                {item.first_name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span className="font-semibold text-slate-900">
                                {item.first_name} {item.last_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{new Date(item.due_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-rose-600">
                            {formatCurrency(Number(item.total_due) - Number(item.amount_paid))}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                              {item.days_overdue} days
                            </span>
                          </td>
                        </tr>
                      ))}
                      {schedule.overdue.items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                            No overdue loans right now.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ───────── TAB 5: STAFF PERFORMANCE ───────── */}
          {activeTab === 'performance' && performance && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Staff performance</h2>
                <button
                  onClick={() => downloadCSV(performance.officers || [], 'staff_performance_report.csv')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-slate-900">Loan officer performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Officer</th>
                        <th className="px-6 py-4 text-center">Originated</th>
                        <th className="px-6 py-4 text-center">Approved</th>
                        <th className="px-6 py-4 text-center">Disbursed</th>
                        <th className="px-6 py-4 text-right">Total principal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {performance.officers.map((officer, idx) => {
                        const pct = Math.round((Number(officer.total_disbursed_principal || 0) / maxPrincipal) * 100);
                        return (
                          <tr key={officer.user_id} className="transition-colors hover:bg-emerald-50/40">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 font-bold text-white shadow-md">
                                  {officer.full_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                                    {officer.full_name}
                                    {idx === 0 && performance.officers.length > 1 && (
                                      <Trophy className="h-4 w-4 text-amber-500" title="Top performer" />
                                    )}
                                  </div>
                                  <div className="text-xs capitalize text-slate-500">{officer.role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-medium text-slate-700">{officer.total_loans_originated}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex min-w-[2.25rem] justify-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                                {officer.approved_count}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex min-w-[2.25rem] justify-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                {officer.disbursed_count}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="ml-auto w-44 text-right">
                                <div className="font-bold text-slate-900">{formatCurrency(officer.total_disbursed_principal)}</div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Reusable pieces ───────────────────────── */

function StatCard({ title, value, icon: Icon, tone }) {
  const t = TONES[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${t.soft} opacity-80 transition duration-300 group-hover:scale-125`} />
      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${t.tile} text-white shadow-lg ${t.glow}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="truncate text-xl font-bold text-slate-900">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, tone, label, value, note, valueClass = 'text-slate-900' }) {
  const t = TONES[tone];
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${t.tile} text-white`}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <h3 className={`mt-4 text-3xl font-extrabold tracking-tight ${valueClass}`}>{value}</h3>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, tall, children }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mb-6 text-sm text-slate-500">{subtitle}</p>}
      <div className={tall ? 'h-80' : 'h-72'}>{children}</div>
    </div>
  );
}

function ScheduleCard({ label, icon: Icon, tone, data, formatCurrency }) {
  const t = TONES[tone];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${t.tile}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {data.count} <span className="text-sm font-medium text-slate-400">loans</span>
          </h3>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${t.tile} text-white shadow-lg ${t.glow}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-lg font-bold text-slate-800">{formatCurrency(data.total_amount)}</p>
    </div>
  );
}
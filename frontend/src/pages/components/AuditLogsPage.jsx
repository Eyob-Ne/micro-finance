import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  User,
  Layers,
  Globe,
  RefreshCw,
  Filter,
} from 'lucide-react';
import api from '../../api/axios.js';

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

function getActionBadge(action) {
  const act = String(action || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-700 ring-slate-200';

  if (act.includes('LOGIN')) {
    color = 'bg-blue-100 text-blue-800 ring-blue-200';
  } else if (act.includes('REACTIVATE')) {
    color = 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  } else if (act.includes('CREATE')) {
    color = 'bg-green-100 text-green-800 ring-green-200';
  } else if (act.includes('UPDATE')) {
    color = 'bg-amber-100 text-amber-800 ring-amber-200';
  } else if (act.includes('DELETE')) {
    color = 'bg-rose-100 text-rose-800 ring-rose-200';
  } else if (act.includes('APPROVE')) {
    color = 'bg-purple-100 text-purple-800 ring-purple-200';
  } else if (act.includes('DISBURSE')) {
    color = 'bg-teal-100 text-teal-800 ring-teal-200';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${color}`}>
      {action}
    </span>
  );
}

const ACTION_OPTIONS = [
  { label: 'All Actions', value: '' },
  { label: 'LOGIN', value: 'LOGIN' },
  { label: 'CREATE', value: 'CREATE' },
  { label: 'UPDATE', value: 'UPDATE' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'APPROVE', value: 'APPROVE' },
  { label: 'DISBURSE', value: 'DISBURSE' },
  { label: 'REACTIVATE', value: 'REACTIVATE' },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [selectedAction, setSelectedAction] = useState('');
  const [q, setQ] = useState('');

  const fetchLogs = async (pageNum = page, actionFilter = selectedAction) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit };
      if (actionFilter) {
        params.action = actionFilter;
      }
      const { data } = await api.get('/audit-logs', { params });
      const rawLogs = Array.isArray(data) ? data : data?.logs || data?.audit_logs || [];
      setLogs(rawLogs);
      setTotalPages(data?.total_pages || Math.ceil((data?.total || rawLogs.length) / limit) || 1);
    } catch (err) {
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, selectedAction);
  }, [page, selectedAction]);

  const handleActionChange = (newAction) => {
    setSelectedAction(newAction);
    setPage(1);
  };

  const term = q.toLowerCase();
  const filteredLogs = logs.filter((log) => {
    if (!term) return true;
    const actionMatch = String(log.action || '').toLowerCase().includes(term);
    const userMatch = String(log.user_name || log.user_email || log.user_id || '').toLowerCase().includes(term);
    const entityMatch = String(log.entity || log.table_name || '').toLowerCase().includes(term);
    return actionMatch || userMatch || entityMatch;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">System Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Track all security events, data modifications, and staff actions.</p>
        </div>
        <button
          onClick={() => fetchLogs(page, selectedAction)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter / Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user or table..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>

          <div className="relative sm:w-56">
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedAction}
              onChange={(e) => handleActionChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-500">
          Showing {filteredLogs.length} events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-slate-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No audit logs found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      System activity will appear here once actions are recorded.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-900">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {log.created_at || log.timestamp
                          ? new Date(log.created_at || log.timestamp).toLocaleString()
                          : '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {(log.user_name || 'U').charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div>{log.user_name || (log.user_id ? `User #${log.user_id}` : 'System')}</div>
                          {log.user_email && (
                            <div className="text-[11px] font-normal text-slate-400">{log.user_email}</div>
                          )}
                        </div>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        {log.entity || log.table_name || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-mono text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        {log.ip_address || log.ip || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

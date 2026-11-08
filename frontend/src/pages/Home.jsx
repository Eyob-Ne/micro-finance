import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  PiggyBank,
  FileBarChart,
  UserCog,
  Menu,
  X,
  LogOut,
  UserCircle,
  ShieldCheck,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

// Define which links each role is allowed to see
const NAV_LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: UserCog },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/loans', label: 'Loans', icon: Wallet },
    { to: '/repayments', label: 'Repayments', icon: CreditCard },
    { to: '/savings', label: 'Savings', icon: PiggyBank },
    { to: '/reports', label: 'Reports', icon: FileBarChart },
    { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  ],
  manager: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/loans', label: 'Loans', icon: Wallet },
    { to: '/reports', label: 'Reports', icon: FileBarChart },
  ],
  cashier: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/repayments', label: 'Repayments', icon: CreditCard },
    { to: '/savings', label: 'Savings', icon: PiggyBank },
  ],
  loan_officer: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/loans', label: 'Loans', icon: Wallet },
    { to: '/repayments', label: 'Repayments', icon: CreditCard },
  ],
};

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop icon-only mode
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Get links based on role, default to empty array if unknown
  const links = NAV_LINKS[user?.role] || [];

  const displayName = user?.full_name || user?.username || user?.email || 'User';
  const firstName = user?.full_name?.split(' ')[0] || user?.username || displayName;
  const initial = (user?.full_name?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const roleLabel = user?.role?.replace('_', ' ') || 'user';

  const currentLink = links.find((l) => pathname.startsWith(l.to));
  const pageTitle = currentLink?.label || (pathname.includes('/profile') ? 'Profile' : 'DMMS');

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // hides text when the desktop sidebar is in icon-only mode
  const hide = collapsed ? 'lg:hidden' : '';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {/* Mobile backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar: full height, stays put while the page content scrolls */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-hidden bg-emerald-950 text-emerald-50 shadow-2xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

        {/* Brand */}
        <div
          className={`relative flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5 ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 shadow-lg shadow-amber-400/30">
            <Building2 className="h-5 w-5 text-emerald-950" />
          </div>
          <div className={hide}>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">DMMS</h1>
            <p className="text-xs font-medium capitalize text-amber-300">{roleLabel}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-2 text-emerald-200 transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : undefined}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  collapsed ? 'lg:justify-center lg:px-0' : ''
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <link.icon className="h-5 w-5 shrink-0" />
              <span className={hide}>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: user card + sign out */}
        <div className="relative shrink-0 border-t border-white/10 p-3">
          <div
            className={`flex items-center gap-3 rounded-xl bg-white/5 p-3 ${
              collapsed ? 'lg:justify-center lg:p-2' : ''
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-emerald-950">
              {initial}
            </div>
            <div className={`min-w-0 flex-1 ${hide}`}>
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-xs capitalize text-emerald-200/70">{roleLabel}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 hover:text-red-100 ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={hide}>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header: fixed at the top, only the content below scrolls */}
        <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden rounded-xl p-2.5 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 lg:block"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">{pageTitle}</h2>
            <p className="hidden text-xs text-slate-500 sm:block">
              Welcome back, {firstName} &middot; {today}
            </p>
          </div>

          {/* Top-right clickable avatar/name and dropdown */}
          <div className="relative ml-auto">
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-label="User menu"
              aria-expanded={profileDropdownOpen}
              className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-semibold leading-tight text-slate-900">{displayName}</span>
                <span className="text-xs text-slate-500">{user?.email || roleLabel}</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-bold text-white shadow-md ring-2 ring-white">
                {initial}
              </div>
            </button>

            {/* Click-outside backdrop */}
            {profileDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
            )}

            {/* Dropdown menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                {/* User's name + email (header, non-clickable) */}
                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                  <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || '—'}</p>
                  <span className="mt-1.5 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-emerald-800">
                    {roleLabel}
                  </span>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content: the only part that scrolls */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

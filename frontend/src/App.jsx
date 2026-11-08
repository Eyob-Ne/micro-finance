import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Public pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Forbidden from './pages/Forbidden.jsx';
import NotFound from './pages/NotFound.jsx';

// Layout
import Home from './pages/Home.jsx';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import CashierDashboard from './pages/cashier/CashierDashboard.jsx';
import LoanOfficerDashboard from './pages/loan_officer/LoanOfficerDashboard.jsx';

// Shared Pages
import ClientsPage from './components/ClientsPage.jsx';
import LoansPage from './components/LoansPage.jsx';
import RepaymentsPage from './components/RepaymentsPage.jsx';
import SavingsPage from './components/SavingsPage.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import UsersPage from './components/UsersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AuditLogsPage from './pages/components/AuditLogsPage.jsx';
import ClientDetailPage from './pages/components/ClientDetailPage.jsx';
import LoanDetailPage from './pages/components/LoanDetailPage.jsx';

// Full-screen loader used while the session is being checked
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// 1. Protected Route Wrapper (private pages: must be logged in)
function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// 2. Guest Route Wrapper (landing + login: logged-in users skip straight to their dashboard)
function GuestOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// 3. Role Guard (Restricts access based on roles)
function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Forbidden />;
  return children;
}

// 4. Role Router (Switches dashboard based on logged-in user)
function DashboardRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'manager': return <ManagerDashboard />;
    case 'cashier': return <CashierDashboard />;
    case 'loan_officer': return <LoanOfficerDashboard />;
    default: return <div className="p-6 text-gray-500">Unknown Role. Please contact support.</div>;
  }
}

// 4. Main App Routes
export default function App() {
  return (
    <Routes>
      {/* ───── Public ───── */}
      <Route
        path="/"
        element={
          <GuestOnly>
            <Landing />
          </GuestOnly>
        }
      />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />

      {/* ───── Private (sidebar + header layout, no path of its own) ───── */}
      <Route
        element={
          <Protected>
            <Home />
          </Protected>
        }
      >
        {/* Dashboard uses the router we built above */}
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* Shared Pages */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="loans/:id" element={<LoanDetailPage />} />
        <Route path="/repayments" element={<RepaymentsPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<RequireRole roles={['admin']}><UsersPage /></RequireRole>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="audit-logs" element={<RequireRole roles={['admin']}><AuditLogsPage /></RequireRole>} />
      </Route>

      {/* Anything unknown goes to the landing page (logged-in users get sent on to /dashboard) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
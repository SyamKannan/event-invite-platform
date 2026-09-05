// ADMIN LAYOUT — the shell every /admin/* screen renders inside. Gates
// access (redirects to /admin/login if not authenticated) and provides a
// consistent header/nav styled to match the public invitation site.
//
// Shared by both roles: an `admin` (the platform owner, full access to
// every invitation) and a `client` (a couple/host, scoped to only their
// own invitation(s), view-only). The header adapts its label based on
// which one is logged in; the actual routed content (Dashboard vs.
// ClientHome, see App.jsx) is what really differs between the two.

import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, LogOut } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext.jsx';
import { adminLogout } from '../lib/api.js';

function Shell() {
  const { user, checked, setUser } = useAdminAuth();
  const navigate = useNavigate();

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm uppercase tracking-[0.3em] text-fg-soft">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  async function handleLogout() {
    await adminLogout().catch(() => {});
    setUser(null);
    navigate('/admin/login');
  }

  const brandLabel = user.role === 'client' ? 'My Invitation' : 'Invitations Admin';

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-accent/15 bg-surface/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="flex items-center gap-2 font-script text-2xl text-accent">
            <Heart size={18} fill="currentColor" /> {brandLabel}
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-fg-soft">{user.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-6xl px-6 py-10"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminAuthProvider>
      <Shell />
    </AdminAuthProvider>
  );
}

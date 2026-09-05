// HOME ROUTER — the /admin index route renders different content
// depending on who's logged in: the platform admin sees every invitation
// (Dashboard.jsx, full CRUD), a client sees only their own (ClientHome.jsx,
// view-only). Both are children of AdminLayout, so useAdminAuth() is
// already populated by the time this renders.

import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import Dashboard from './Dashboard.jsx';
import ClientHome from '../client/ClientHome.jsx';

export default function HomeRouter() {
  const { user } = useAdminAuth();

  return user.role === 'client' ? <ClientHome /> : <Dashboard />;
}

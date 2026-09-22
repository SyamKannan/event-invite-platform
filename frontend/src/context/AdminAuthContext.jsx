// ADMIN AUTH CONTEXT — tracks whether the current browser session is logged
// in as an admin. Backed by a Sanctum personal access token (Bearer header,
// see lib/api.js) rather than cookie-session auth, so frontend/backend can
// live on unrelated domains; we ask the API "who am I?" on load using the
// stored token and remember the answer.
//
// Any later 401 (token expired or revoked, e.g. after a password reset)
// makes lib/api.js dispatch UNAUTHORIZED_EVENT; we drop the user here, and
// AdminLayout's guard sends them back to the login screen.

import { createContext, useContext, useEffect, useState } from 'react';
import { adminMe, getAdminToken, UNAUTHORIZED_EVENT } from '../lib/api.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = logged out
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) {
      setUser(null);
      setChecked(true);
      return;
    }
    adminMe()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, setUser, checked }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth() must be used within an <AdminAuthProvider>.');
  return ctx;
}

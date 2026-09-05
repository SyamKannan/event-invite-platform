// ADMIN AUTH CONTEXT — tracks whether the current browser session is logged
// in as an admin. Backed by Laravel Sanctum's cookie-based SPA auth: there's
// no token to store client-side, we just ask the API "who am I?" on load and
// remember the answer.

import { createContext, useContext, useEffect, useState } from 'react';
import { adminMe } from '../lib/api.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = logged out
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    adminMe()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
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

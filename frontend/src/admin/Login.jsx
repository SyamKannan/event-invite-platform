// ADMIN LOGIN — email/password against Laravel Sanctum's SPA cookie auth.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, LogIn } from 'lucide-react';
import { adminLogin } from '../lib/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.status === 422 ? 'Incorrect email or password.' : err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,rgba(212,168,95,0.12),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(207,142,132,0.1),transparent_50%)] px-6">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm rounded-3xl border border-accent/20 bg-surface p-8 text-ink shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]"
      >
        <div className="text-center">
          <Heart size={28} className="mx-auto text-accent" fill="currentColor" />
          <h1 className="mt-3 font-script text-3xl text-accent">Admin Login</h1>
        </div>

        <label className="mt-8 block">
          <span className="text-xs uppercase tracking-[0.25em] text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-[0.25em] text-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>

        {error && <p className="mt-4 text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm uppercase tracking-[0.2em] text-white disabled:opacity-50 transition hover:bg-gold"
        >
          <LogIn size={16} /> {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </motion.form>
    </div>
  );
}

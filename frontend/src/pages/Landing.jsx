// LANDING — tiny marketing stub at "/". Most traffic goes straight to an
// invitation's own /i/:slug link; this page just points people to the admin.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_20%_10%,rgba(212,168,95,0.12),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(207,142,132,0.1),transparent_50%)] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Heart size={40} className="mx-auto text-accent" fill="currentColor" />
        <h1 className="mt-6 font-script text-5xl text-accent">Invitations</h1>
        <p className="mt-3 max-w-sm text-fg-soft">
          Beautiful, animated wedding and birthday invitations — one link per celebration.
        </p>
        <Link
          to="/admin/login"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-gold hover:-translate-y-0.5"
        >
          Admin login
        </Link>
      </motion.div>
    </div>
  );
}

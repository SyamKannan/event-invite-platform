// INVITATION PREVIEW — the real public page, rendered for a logged-in
// admin/owner from GET /api/admin/invitations/{id}/preview, so a DRAFT can
// be checked before anybody gets the link. The public /i/{slug} route only
// serves published invitations (by design), which is why "Preview" needs
// its own authenticated route instead of just linking there.
//
// Deliberately NOT nested inside AdminLayout: the invitation needs the
// whole viewport (fixed envelope cover, full-bleed hero), not the admin
// shell's header and max-width container. A slim floating bar links back.

import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext.jsx';
import { ConfigProvider } from '../context/ConfigContext.jsx';
import { adminPreviewConfig, errorMessage } from '../lib/api.js';
import { getShell } from '../shells/registry.js';
import { ErrorBoundary, PageErrorFallback } from '../components/ErrorBoundary.jsx';

function Preview() {
  const { id } = useParams();
  const { user, checked } = useAdminAuth();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!checked || !user) return;
    adminPreviewConfig(id)
      .then(setConfig)
      .catch((err) => setError(errorMessage(err, 'Could not load this preview.')));
  }, [id, checked, user]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm uppercase tracking-[0.3em] text-fg-soft">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(`/admin/preview/${id}`)}`} replace />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-center">
        <div>
          <p className="text-sm text-rose">{error}</p>
          <Link to="/admin" className="mt-4 inline-block text-xs uppercase tracking-[0.2em] text-accent">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm uppercase tracking-[0.3em] text-fg-soft">Loading preview…</p>
      </div>
    );
  }

  const Shell = getShell(config.type);

  return (
    <>
      {/* Bottom-left so it doesn't sit under the nav or the music button. */}
      <div className="fixed bottom-4 left-4 z-[300] flex items-center gap-3 rounded-full border border-accent/30 bg-bg/90 px-4 py-2 text-xs text-fg-soft shadow-[0_8px_24px_-10px_rgba(0,0,0,0.7)] backdrop-blur-sm">
        <Eye size={14} className="text-accent" />
        <span className="uppercase tracking-[0.2em]">Preview</span>
        <Link to={`/admin/invitations/${id}`} className="inline-flex items-center gap-1 text-accent">
          <ArrowLeft size={12} /> Editor
        </Link>
      </div>

      <ConfigProvider config={config} key={id}>
        <Shell />
      </ConfigProvider>
    </>
  );
}

export default function InvitationPreview() {
  return (
    <AdminAuthProvider>
      <ErrorBoundary name="preview" fallback={<PageErrorFallback />}>
        <Preview />
      </ErrorBoundary>
    </AdminAuthProvider>
  );
}

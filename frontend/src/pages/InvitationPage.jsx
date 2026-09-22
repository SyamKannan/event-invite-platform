// INVITATION PAGE — fetches one invitation's config by slug from the Laravel
// API and renders it through the page shell for its event type (see
// shells/registry.js). Wedding/birthday (and every type without its own
// shell yet) render via StandardShell — the exact same section composition
// the old static site used.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConfigProvider } from '../context/ConfigContext.jsx';
import { getInvitationConfig } from '../lib/api.js';
import { getShell } from '../shells/registry.js';

export default function InvitationPage() {
  const { slug } = useParams();
  const [config, setConfig] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setConfig(null);
    setNotFound(false);

    getInvitationConfig(slug)
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="font-script text-4xl text-accent">Invitation not found</p>
          <p className="mt-3 text-fg-soft">
            This link may have expired or the invitation hasn't been published yet.
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm uppercase tracking-[0.3em] text-fg-soft">Loading…</p>
      </div>
    );
  }

  const Shell = getShell(config.type);

  return (
    <ConfigProvider config={config} key={slug}>
      <Shell />
    </ConfigProvider>
  );
}

// INVITATION PAGE — fetches one invitation's config by slug from the Laravel
// API and renders it through the page shell for its event type (see
// shells/registry.js). Wedding/birthday (and every type without its own
// shell yet) render via StandardShell — the exact same section composition
// the old static site used.
//
// A 404 (unknown or unpublished slug) and any other failure (network down,
// server error) are shown differently: telling a guest "not found" when the
// server merely hiccupped would make them think the link is wrong.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConfigProvider } from '../context/ConfigContext.jsx';
import { getInvitationConfig } from '../lib/api.js';
import { getShell } from '../shells/registry.js';

export default function InvitationPage() {
  const { slug } = useParams();
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | not-found | error
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setConfig(null);
    setStatus('loading');

    getInvitationConfig(slug)
      .then((data) => {
        if (cancelled) return;
        setConfig(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  if (status === 'not-found' || status === 'error') {
    const notFound = status === 'not-found';
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="font-script text-4xl text-accent">
            {notFound ? 'Invitation not found' : 'Could not load the invitation'}
          </p>
          <p className="mt-3 text-fg-soft">
            {notFound
              ? "This link may be mistyped, or the invitation hasn't been published yet."
              : 'Please check your connection and try again.'}
          </p>
          {!notFound && (
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="mt-6 rounded-full border border-accent/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10"
            >
              Try again
            </button>
          )}
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

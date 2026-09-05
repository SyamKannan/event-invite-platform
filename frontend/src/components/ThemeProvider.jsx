// THEME PROVIDER — applies this invitation's theme override onto the page,
// by setting CSS variables on <html>. Reads config fresh on every mount
// (ConfigProvider is keyed by slug, so switching invitations remounts this)
// and re-applies whenever config.theme itself changes (e.g. an admin
// preview), and — importantly — RESETS every variable back to the
// site-wide default (from src/index.css) on unmount and whenever a key is
// missing from the override. Without the reset, a themed invitation's
// colors leak into the next page you visit, since CSS variables on <html>
// are global DOM state, not scoped to this component's subtree.

import { useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

// Must match the :root defaults in src/index.css exactly — this is what we
// fall back to for any key the current invitation doesn't override.
const DEFAULT_THEME = {
  bg: '50 12 24',
  surface: '255 248 241',
  fg: '245 232 215',
  fgSoft: '220 200 175',
  ink: '47 25 30',
  muted: '175 150 130',
  accent: '212 168 95',
  gold: '195 145 70',
  rose: '207 142 132',
};

const CSS_VAR_BY_KEY = {
  bg: '--color-bg',
  surface: '--color-surface',
  fg: '--color-fg',
  fgSoft: '--color-fg-soft',
  ink: '--color-ink',
  muted: '--color-muted',
  accent: '--color-accent',
  gold: '--color-gold',
  rose: '--color-rose',
};

export function ThemeProvider({ children }) {
  const config = useConfig();
  const theme = config.theme;

  useEffect(() => {
    const root = document.documentElement;

    Object.entries(CSS_VAR_BY_KEY).forEach(([key, cssVar]) => {
      root.style.setProperty(cssVar, theme?.[key] || DEFAULT_THEME[key]);
    });

    // Sync <title> and <meta description> with the config.
    document.title = config.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', config.meta.description);

    // On unmount (navigating away from this invitation), restore the
    // site-wide defaults so the next page never inherits leftover colors.
    return () => {
      Object.entries(CSS_VAR_BY_KEY).forEach(([key, cssVar]) => {
        root.style.setProperty(cssVar, DEFAULT_THEME[key]);
      });
    };
  }, [theme, config.meta.title, config.meta.description]);

  return children;
}

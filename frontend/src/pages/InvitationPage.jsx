// INVITATION PAGE — fetches one invitation's config by slug from the Laravel
// API and renders the exact same section composition the old static site
// used, now driven by ConfigProvider instead of a hardcoded import.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConfigProvider } from '../context/ConfigContext.jsx';
import { getInvitationConfig } from '../lib/api.js';

import { ThemeProvider } from '../components/ThemeProvider.jsx';
import { Envelope } from '../components/Envelope.jsx';
import { NavBar } from '../components/NavBar.jsx';
import { Footer } from '../components/Footer.jsx';
import { MusicToggle } from '../components/MusicToggle.jsx';
import { FloatingHearts } from '../components/FloatingHearts.jsx';

import { Hero } from '../sections/Hero.jsx';
import { Countdown } from '../sections/Countdown.jsx';
import { Story } from '../sections/Story.jsx';
import { Schedule } from '../sections/Schedule.jsx';
import { RSVP } from '../sections/RSVP.jsx';
import { Gallery } from '../sections/Gallery.jsx';
import { Guestbook } from '../sections/Guestbook.jsx';

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

  return (
    <ConfigProvider config={config} key={slug}>
      <ThemeProvider>
        <Envelope />
        <FloatingHearts />
        <NavBar />
        <main>
          <Hero />
          <Countdown />
          <Story />
          <Schedule />
          <RSVP />
          <Gallery />
          <Guestbook />
        </main>
        <Footer />
        <MusicToggle />
      </ThemeProvider>
    </ConfigProvider>
  );
}

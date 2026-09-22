// STANDARD SHELL — the original section composition (Hero, Countdown, Story,
// Schedule, RSVP, Gallery, Guestbook) every wedding/birthday invitation has
// always rendered. Used as the default shell for any event type that hasn't
// declared a structurally different layout (baby_naming, house_warming,
// anniversary, retirement, reunion, religious all reuse this). Each section
// self-guards on its own config.<section>.enabled flag, so a type whose
// registry entry omits a module (e.g. no 'rsvp') simply renders nothing for
// that section — no extra logic needed here.

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

export function StandardShell() {
  return (
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
  );
}

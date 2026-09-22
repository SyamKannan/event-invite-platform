// INVITATION TEXT HELPERS — small pieces of copy every public section needs
// and that must work for every event type, not just weddings: the display
// name (couple / celebrant / generic people), the event date, and the
// rotating quotes/blessings (a "successful marriage" quote has no place on a
// business opening or a retirement page).

// "Aisha & Rahul", "Priya", or the generic people map for other types.
export function displayName(config) {
  if (config.type === 'birthday') return config.celebrant?.firstName || '';

  if (config.couple) {
    return [config.couple.bride?.firstName, config.couple.groom?.firstName]
      .filter(Boolean)
      .join(` ${config.couple.connector ?? '&'} `);
  }

  return Object.values(config.people || {})
    .map((p) => p?.firstName)
    .filter(Boolean)
    .join(' & ');
}

// The event instant as a Date, or null when no date has been set yet (a new
// Date(null) would silently mean 1 Jan 1970).
export function eventDate(config) {
  const iso = config.eventDateISO ?? config.weddingDateISO;
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Title for <title> / link previews when the admin didn't set one.
export function pageTitle(config) {
  if (config.meta?.title) return config.meta.title;
  const name = displayName(config);
  return name ? `${name} — You're invited` : "You're invited";
}

const QUOTES = {
  romance: [
    '"May your love be modern enough to survive the times, and old-fashioned enough to last forever."',
    '"A successful marriage requires falling in love many times, always with the same person."',
    '"The best thing to hold onto in life is each other."',
    '"Where there is great love, there are always wishes."',
    '"You are my today and all of my tomorrows."',
  ],
  celebration: [
    '"The more you praise and celebrate your life, the more there is in life to celebrate."',
    '"Count your life by smiles, not tears. Count your age by friends, not years."',
    '"Good times and crazy friends make the best memories."',
    '"Here\'s to the moments that take our breath away."',
  ],
  home: [
    '"Home is where love resides, memories are created, and laughter never ends."',
    '"A house is made of walls and beams; a home is built with love and dreams."',
    '"May this home be filled with warmth, laughter, and every good thing."',
  ],
  community: [
    '"Alone we can do so little; together we can do so much."',
    '"Coming together is a beginning, staying together is progress."',
    '"The best memories are made together."',
  ],
  business: [
    '"Every great journey begins with opening the door."',
    '"Thank you for being part of our beginning."',
    '"Built with passion, opened with gratitude."',
  ],
};

const BLESSINGS = {
  romance: [
    'May your love story be the greatest ever told.',
    'Wishing you endless laughter and a lifetime of joy.',
    'Two hearts, one beautiful journey. Congratulations!',
    'May your home be filled with warmth, love, and laughter.',
    "Here's to love, laughter, and happily ever after.",
  ],
  celebration: [
    'Wishing you a year full of joy and wonderful surprises!',
    'May this celebration be the start of your best chapter yet.',
    'Sending you love and the happiest of wishes today.',
    'Cheers to you and to many more happy moments!',
  ],
  home: [
    'May your new home be filled with love and laughter.',
    'Wishing you happiness in every room and peace at every door.',
    'Congratulations on your beautiful new home!',
  ],
  community: [
    'So happy to be part of this — see you there!',
    'Wishing everyone a wonderful time together.',
    'Grateful for this community and everyone in it.',
  ],
  business: [
    'Congratulations on the grand opening — wishing you great success!',
    'May your business grow and flourish.',
    'So proud of you — here is to a thriving venture!',
  ],
};

const TONE_BY_TYPE = {
  wedding: 'romance',
  anniversary: 'romance',
  birthday: 'celebration',
  baby_naming: 'celebration',
  retirement: 'celebration',
  house_warming: 'home',
  reunion: 'community',
  religious: 'community',
  business_opening: 'business',
  visiting_card: 'business',
};

function tone(type) {
  return TONE_BY_TYPE[type] || 'celebration';
}

export function footerQuotes(type) {
  return QUOTES[tone(type)];
}

export function guestbookBlessings(type) {
  return BLESSINGS[tone(type)];
}

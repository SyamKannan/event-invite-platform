// =============================================================================
// THE WEDDING CONFIG
// -----------------------------------------------------------------------------
// This is the ONE file you edit to change the whole site. Every section
// reads its data from here.
// =============================================================================

export const config = {
  // ---- Browser tab + share preview ------------------------------------------
  meta: {
    title: 'Syam & Swathi — Wedding Invitation',
    description:
      'With joy in our hearts, we invite you to celebrate the wedding of Syam & Swathi.',
  },

  // ---- The couple ------------------------------------------------------------
  couple: {
    bride: {
      firstName: 'Syam',
      parents: 'Daughter of Mr. Sivadas & Mrs. Latha',
    },
    groom: {
      firstName: 'Swathi',
      parents: 'Son of Mr. Abdul Rahman & Mrs. Fathima',
    },
    connector: '&',
  },

  // ---- The wedding date ------------------------------------------------------
  weddingDateISO: '2026-06-14T16:00:00+05:30',
  display: {
    date: 'Saturday, 14th June 2026',
    time: '4:00 PM onwards',
    location: 'Thrissur, Kerala',
  },

  // ---- Envelope cover -------------------------------------------------------
  envelope: {
    enabled: true,
    overline: 'You are invited to celebrate',
    cta: 'Open Invitation',
    // One of the keys in src/components/envelope/registry.js (and
    // backend/app/Support/EnvelopeAnimations.php), chosen per-invitation by
    // the admin. See components/Envelope.jsx.
    animation: 'swing-doors',
  },

  // ---- Hero -----------------------------------------------------------------
  hero: {
    backgroundImage:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80',
    overline: 'Together with our families',
    tagline: 'request the honour of your presence',
  },

  // ---- "Our Journey" constellation -----------------------------------------
  // Each milestone has an x/y position (0-100, percent) for its star on the
  // constellation. Tweak these to space the stars however you like.
  story: {
    enabled: true,
    title: 'Our Journey',
    subtitle: 'A few moments along the way',
    // The constellation lays out each star at (x, y) — both 0-100, where
    // 0=left/top and 100=right/bottom of the canvas. Keep x between ~18-82
    // and y between ~22-75 so the labels never get clipped by the edges.
    milestones: [
      {
        x: 22, y: 72,
        date: 'Spring 2022',
        title: 'How we met',
        description:
          'Two strangers, a shared train ride, and a conversation that lasted longer than either expected.',
        image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80',
      },
      {
        x: 50, y: 24,
        date: 'Autumn 2023',
        title: 'First trip together',
        description:
          'A weekend escape to Munnar — misty hills, endless tea, and the quiet certainty that this was something rare.',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80',
      },
      {
        x: 78, y: 72,
        date: 'Winter 2024',
        title: 'The proposal',
        description:
          'On a candlelit terrace under the stars, a question was asked — and joyfully answered.',
        image: 'https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=900&q=80',
      },
    ],
  },

  // ---- Schedule -------------------------------------------------------------
  // Optional: provide `tabs` to split events between groom-side / bride-side.
  // Each event then declares which `team` it belongs to. Omit `tabs` to show
  // every event in a single grid.
  schedule: {
    enabled: true,
    title: 'The Celebration',
    subtitle: 'Join us across these moments',
    tabs: [
      { id: 'groom', label: 'Groom Side' },
      { id: 'bride', label: 'Bride Side' },
    ],
    events: [
      {
        id: 'nikkah',
        team: 'groom',
        title: 'Nikkah',
        date: '2026-06-14',
        time: '4:00 PM',
        venue: 'Grand Hyatt, Bolgatty',
        address: 'Bolgatty Island, Mulavukad, Kochi 682504',
        mapUrl: 'https://maps.google.com/?q=Grand+Hyatt+Kochi',
        dresscode: 'Traditional / Formal',
      },
      {
        id: 'reception',
        team: 'groom',
        title: 'Reception',
        date: '2026-06-14',
        time: '7:30 PM',
        venue: 'Le Méridien Convention Centre',
        address: 'Maradu, Kochi 682304',
        mapUrl: 'https://maps.google.com/?q=Le+Meridien+Kochi',
        dresscode: 'Black tie optional',
      },
      {
        id: 'walima',
        team: 'bride',
        title: 'Walima',
        date: '2026-06-15',
        time: '12:30 PM',
        venue: 'The Leela',
        address: 'Maradu, Kochi 682040',
        mapUrl: 'https://maps.google.com/?q=The+Leela+Kochi',
        dresscode: 'Festive',
      },
      {
        id: 'mehndi',
        team: 'bride',
        title: 'Mehndi',
        date: '2026-06-13',
        time: '5:00 PM',
        venue: "Bride's Residence",
        address: 'Panampilly Nagar, Kochi 682036',
        mapUrl: 'https://maps.google.com/?q=Panampilly+Nagar+Kochi',
        dresscode: 'Pastel',
      },
    ],
  },

  // ---- RSVP ("Be Our Guest") ------------------------------------------------
  rsvp: {
    enabled: true,
    title: 'Be Our Guest',
    message:
      '"Your presence will add an extra touch of joy to our celebration. We would be absolutely honoured to have you stand with us as we say \'I do\'."',
    acceptLabel: 'Joyfully Accept',
    declineLabel: 'Regretfully Decline',
    acceptThankyou: 'We can\'t wait to celebrate with you!',
    declineThankyou: 'You\'ll be in our hearts that day.',
  },

  // ---- Photo gallery --------------------------------------------------------
  gallery: {
    enabled: true,
    title: 'Moments',
    subtitle: 'A little glimpse into us',
    images: [
      { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80', alt: 'Couple under fairy lights', span: 'tall' },
      { src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80', alt: 'Bride holding bouquet' },
      { src: 'https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=900&q=80', alt: 'Wedding rings on roses' },
      { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80', alt: 'Couple holding hands', span: 'wide' },
      { src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=900&q=80', alt: 'Decorated venue' },
      { src: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=900&q=80', alt: 'Floral arrangement' },
      { src: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=900&q=80', alt: 'Sparkler send-off', span: 'tall' },
      { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80', alt: 'Couple at golden hour' },
    ],
  },

  // ---- Guestbook (wishes wall) ----------------------------------------------
  guestbook: {
    enabled: true,
    title: 'Wishes & Blessings',
    subtitle: 'Leave a note we will treasure forever',
    supabaseEnabled: true,
  },

  // ---- Background music -----------------------------------------------------
  music: {
    enabled: true,
    src: '/audio/ambient.mp3',
    title: 'Background music',
    autoplay: false,
  },

  // ---- Theme override (optional) --------------------------------------------
  theme: undefined,

  // ---- Contact (footer) -----------------------------------------------------
  contact: {
    bridePhone: '+91 98000 00000',
    groomPhone: '+91 98111 11111',
    email: 'hello@example.com',
    instagram: '@aiman.mahroof.wedding',
  },

  // ---- Floating decorations -------------------------------------------------
  floatingDecor: {
    enabled: true,
    count: 14,
    symbols: ['❤', '✦', '✿', '❤', '✦'],
  },
};

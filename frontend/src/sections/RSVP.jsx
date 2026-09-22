// "BE OUR GUEST" — multi-step RSVP with name, meal preference, and message.
//
//   1. Multi-step form: Step 0 = Accept/Decline, Step 1 = details, Step 2 = done
//   2. Confetti burst when accepting (colors follow the invitation's theme)
//   3. Guest count selector + meal preference for acceptances — meal
//      choices come from config.rsvp.mealOptions per event type, and the
//      question is hidden entirely when that list is empty
//   4. The response is remembered on this device (with the edit token the
//      API returns), so a returning guest sees their answer and can change
//      it — updating the same RSVP instead of adding a duplicate
//   5. A hidden honeypot field that real guests never fill (bots do, and
//      the API rejects those submissions)

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Heart, Sparkles, X, Users, UtensilsCrossed, MessageSquare } from 'lucide-react';
import { useConfig } from '../context/ConfigContext.jsx';
import { errorMessage, submitRsvp } from '../lib/api.js';

const GUEST_COUNTS = [1, 2, 3, 4, 5, 6];
const NOTE_MAX = 500;

function storageKey(slug) {
  return `rsvp:${slug}`;
}

function loadSaved(slug) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(slug)) || 'null');
  } catch {
    return null;
  }
}

function save(slug, value) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(value));
  } catch {
    // Private mode etc. — the RSVP is still saved server-side.
  }
}

// Confetti in the invitation's own accent/rose/gold colors.
function spawnConfetti(container) {
  const vars = ['--color-accent', '--color-rose', '--color-gold', '--color-surface'];
  const styles = getComputedStyle(document.documentElement);
  const colors = vars.map((v) => `rgb(${styles.getPropertyValue(v).trim() || '212 168 95'})`);

  for (let i = 0; i < 60; i++) {
    const el = document.createElement('span');
    el.style.cssText = `
      position:absolute;
      left:${40 + Math.random() * 20}%;
      top:40%;
      width:${6 + Math.random() * 8}px;
      height:${6 + Math.random() * 8}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      pointer-events:none;
      animation: confetti-fly ${0.8 + Math.random()}s ease-out ${Math.random() * 0.4}s forwards;
      --dx: ${(Math.random() - 0.5) * 300}px;
      --dy: ${-(80 + Math.random() * 200)}px;
      --rot: ${Math.random() * 720}deg;
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

export function RSVP() {
  const config = useConfig();
  const { rsvp, slug } = config;
  const mealOptions = rsvp?.mealOptions ?? [];

  const [saved, setSaved] = useState(() => loadSaved(slug));
  // Which step are we on? 0 = choose accept/decline, 1 = fill details, 2 = done
  const [step, setStep] = useState(() => (saved ? 2 : 0));
  const [choice, setChoice] = useState(saved?.choice ?? null);
  const [name, setName] = useState(saved?.name ?? '');
  const [guests, setGuests] = useState(saved?.guests ?? 1);
  const [meal, setMeal] = useState(saved?.meal ?? '');
  const [note, setNote] = useState(saved?.note ?? '');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

  // Different invitation in the same tab (ConfigProvider is keyed by slug,
  // but be explicit): reload what this device answered for *this* one.
  useEffect(() => {
    setSaved(loadSaved(slug));
  }, [slug]);

  if (!rsvp || !rsvp.enabled) return null;

  function choose(next) {
    setChoice(next);
    setStep(1);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitRsvp(slug, {
        guest_name: name.trim(),
        choice,
        guest_count: choice === 'accept' ? guests : 1,
        meal_preference: choice === 'accept' ? meal || null : null,
        note: note.trim() || null,
        website,
        ...(saved?.id ? { rsvp_id: saved.id, edit_token: saved.editToken } : {}),
      });

      const record = {
        id: response.id,
        editToken: response.edit_token,
        choice,
        name: name.trim(),
        guests,
        meal,
        note: note.trim(),
      };
      save(slug, record);
      setSaved(record);
      setStep(2);

      if (choice === 'accept' && containerRef.current) {
        spawnConfetti(containerRef.current);
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not send your RSVP. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="rsvp" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-accent/20 bg-bg/60 p-8 text-center backdrop-blur-md shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] sm:p-12"
        >
          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-accent/40 to-rose/30 ring-4 ring-accent/20">
            <Sparkles size={48} className="text-accent" />
          </div>

          <h2 className="mt-6 font-script text-5xl text-fg">{rsvp.title}</h2>
          <span aria-hidden className="mx-auto mt-2 block h-px w-20 bg-accent/60" />

          {/* Step indicator dots */}
          <div className="mt-6 flex items-center justify-center gap-2" aria-hidden>
            {[0, 1, 2].map((s) => (
              <motion.div
                key={s}
                animate={{ width: step === s ? 24 : 8, opacity: step >= s ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full bg-accent"
              />
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* STEP 0: Accept / Decline */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <p className="mt-6 px-2 font-display text-lg italic leading-relaxed text-fg-soft sm:text-xl">
                  {rsvp.message}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => choose('accept')}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm uppercase tracking-[0.2em] text-ink shadow-[0_8px_24px_-10px_rgba(0,0,0,0.6)] transition hover:bg-gold hover:-translate-y-0.5"
                  >
                    <Check size={16} strokeWidth={3} />
                    {rsvp.acceptLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => choose('decline')}
                    className="inline-flex items-center gap-2 rounded-full border border-fg-soft/30 px-6 py-3 text-sm uppercase tracking-[0.2em] text-fg-soft transition hover:bg-fg/5 hover:-translate-y-0.5"
                  >
                    <X size={16} strokeWidth={3} />
                    {rsvp.declineLabel}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Details form */}
            {step === 1 && (
              <motion.form
                key="step1"
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="mt-8 text-left space-y-5"
              >
                <p className="text-center text-sm uppercase tracking-[0.25em] text-fg-soft">
                  {choice === 'accept' ? '🎉 Wonderful! Just a few details…' : "We'll miss you — but your kind words mean the world."}
                </p>

                {/* Honeypot — visually hidden, skipped by keyboard and screen readers. */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-px w-px opacity-0"
                />

                <label className="block">
                  <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                    <Heart size={12} className="text-accent" /> Your name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aisha Rahman"
                    maxLength={60}
                    required
                    autoComplete="name"
                    className="w-full rounded-xl border border-accent/30 bg-surface/80 px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>

                {choice === 'accept' && (
                  <fieldset className="block">
                    <legend className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                      <Users size={12} className="text-accent" /> Number of guests
                    </legend>
                    <div className="flex flex-wrap items-center gap-3">
                      {GUEST_COUNTS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setGuests(n)}
                          aria-pressed={guests === n}
                          className={`h-10 w-10 rounded-full border text-sm transition ${
                            guests === n
                              ? 'border-accent bg-accent text-ink'
                              : 'border-accent/30 bg-surface/60 text-ink hover:border-accent/60'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {choice === 'accept' && mealOptions.length > 0 && (
                  <fieldset className="block">
                    <legend className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                      <UtensilsCrossed size={12} className="text-accent" /> Meal preference
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {mealOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMeal(meal === opt ? '' : opt)}
                          aria-pressed={meal === opt}
                          className={`rounded-full px-4 py-1.5 text-xs transition ${
                            meal === opt
                              ? 'bg-accent text-ink'
                              : 'border border-accent/30 text-fg-soft hover:border-accent/60'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <label className="block">
                  <span className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                    <span className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-accent" />
                      {choice === 'accept' ? 'A personal note (optional)' : 'Send them love (optional)'}
                    </span>
                    <span className={note.length > NOTE_MAX * 0.85 ? 'text-rose' : ''}>{note.length}/{NOTE_MAX}</span>
                  </span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={NOTE_MAX}
                    placeholder="Wishing you all the very best…"
                    className="w-full resize-none rounded-xl border border-accent/30 bg-surface/80 px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>

                {error && <p role="alert" className="text-sm text-rose">{error}</p>}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-xs uppercase tracking-[0.2em] text-fg-soft hover:text-fg transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-ink disabled:opacity-40 transition hover:bg-gold hover:-translate-y-0.5"
                  >
                    {submitting ? 'Sending…' : saved ? 'Update' : 'Confirm'} <ChevronRight size={14} />
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 2: Thank you */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20"
                >
                  {choice === 'accept'
                    ? <Sparkles size={28} className="text-accent" />
                    : <Heart size={28} className="text-rose" />}
                </motion.div>

                <p className="font-script text-4xl text-accent">
                  {name ? `Thank you, ${name}!` : 'Thank you!'}
                </p>
                <p className="mt-3 text-fg-soft">
                  {choice === 'accept' ? rsvp.acceptThankyou : rsvp.declineThankyou}
                </p>

                {choice === 'accept' && (
                  <p className="mt-2 text-xs text-fg-soft/70">
                    {guests} {guests === 1 ? 'guest' : 'guests'}
                    {mealOptions.length > 0 && ` · ${meal || 'No meal preference'}`}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="mt-6 text-xs uppercase tracking-[0.2em] text-fg-soft underline-offset-4 transition hover:text-fg hover:underline"
                >
                  Change my response
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

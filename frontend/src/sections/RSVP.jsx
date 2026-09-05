// "BE OUR GUEST" — multi-step RSVP with name, meal preference, and message.
//
// NEW FEATURES:
//   1. Multi-step form: Step 1 = Accept/Decline, Step 2 = Name + meal pref + note
//   2. Confetti burst when accepting
//   3. Elegant step indicator dots
//   4. Animated step transitions
//   5. Guest count selector for acceptances
//
// All beginner-friendly: each useState is commented to explain what it does.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Heart, Sparkles, X, Users, UtensilsCrossed, MessageSquare } from 'lucide-react';
import { useConfig } from '../context/ConfigContext.jsx';
import { submitRsvp } from '../lib/api.js';

// Simple confetti particle spawner — pure CSS, no library needed.
function spawnConfetti(container) {
  const colors = ['#d4a85f', '#cf8e84', '#f9d77e', '#fff8f1', '#a87b4e'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('span');
    el.className = 'confetti-particle';
    el.style.cssText = `
      position:absolute;
      left:${40 + Math.random()*20}%;
      top:40%;
      width:${6+Math.random()*8}px;
      height:${6+Math.random()*8}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random()>0.5?'50%':'2px'};
      pointer-events:none;
      animation: confetti-fly ${0.8+Math.random()*1}s ease-out ${Math.random()*0.4}s forwards;
      --dx: ${(Math.random()-0.5)*300}px;
      --dy: ${-(80+Math.random()*200)}px;
      --rot: ${Math.random()*720}deg;
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

export function RSVP() {
  const config = useConfig();
  const { rsvp, slug } = config;

  // Which step are we on? 0 = choose accept/decline, 1 = fill details, 2 = done
  const [step, setStep] = useState(0);
  // Did they accept or decline?
  const [choice, setChoice] = useState(null);
  // Form field values
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(1);
  const [meal, setMeal] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

  if (!rsvp || !rsvp.enabled) return null;

  // Step 1: Accept button pressed
  function handleAccept() {
    setChoice('accept');
    setStep(1);
  }

  // Step 1: Decline button pressed
  function handleDecline() {
    setChoice('decline');
    setStep(1);
  }

  // Step 2: Form submitted
  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitRsvp(slug, {
        guest_name: name.trim(),
        choice,
        guest_count: choice === 'accept' ? guests : 1,
        meal_preference: choice === 'accept' ? meal || null : null,
        note: note.trim() || null,
      });
      setStep(2);
      // Trigger confetti only for accepts
      if (choice === 'accept' && containerRef.current) {
        spawnConfetti(containerRef.current);
      }
    } catch {
      setError('Could not send your RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const mealOptions = ['Vegetarian', 'Non-vegetarian', 'Vegan', 'No preference'];

  return (
    <section id="rsvp" className="relative scroll-mt-20 py-20 sm:py-28">
      {/* Confetti CSS — injected once */}
      <style>{`
        @keyframes confetti-fly {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

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

          {/* Heart icon */}
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-accent/40 to-rose/30 ring-4 ring-accent/20">
            <Heart size={48} className="text-accent" fill="currentColor" />
          </div>

          <h2 className="mt-6 font-script text-5xl text-fg">{rsvp.title}</h2>
          <span aria-hidden className="mx-auto mt-2 block h-px w-20 bg-accent/60" />

          {/* Step indicator dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {[0, 1, 2].map((s) => (
              <motion.div
                key={s}
                animate={{ width: step === s ? 24 : 8, opacity: step >= s ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full bg-accent"
              />
            ))}
          </div>

          {/* Step content — animates between steps */}
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
                    onClick={handleAccept}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm uppercase tracking-[0.2em] text-ink shadow-[0_8px_24px_-10px_rgba(0,0,0,0.6)] transition hover:bg-gold hover:-translate-y-0.5"
                  >
                    <Check size={16} strokeWidth={3} />
                    {rsvp.acceptLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
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
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="mt-8 text-left space-y-5"
              >
                <p className="text-center text-sm uppercase tracking-[0.25em] text-fg-soft">
                  {choice === 'accept' ? '🎉 Wonderful! Just a few details…' : 'We\'ll miss you — but your kind words mean the world.'}
                </p>

                {/* Name field */}
                <label className="block">
                  <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                    <Heart size={12} className="text-accent" /> Your name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aisha Rahman"
                    maxLength={60}
                    className="w-full rounded-xl border border-accent/30 bg-surface/80 px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>

                {/* Guest count — only for accepts */}
                {choice === 'accept' && (
                  <label className="block">
                    <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                      <Users size={12} className="text-accent" /> Number of guests
                    </span>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setGuests(n)}
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
                  </label>
                )}

                {/* Meal preference — only for accepts */}
                {choice === 'accept' && (
                  <label className="block">
                    <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                      <UtensilsCrossed size={12} className="text-accent" /> Meal preference
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {mealOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMeal(opt)}
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
                  </label>
                )}

                {/* Personal note */}
                <label className="block">
                  <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-soft mb-2">
                    <MessageSquare size={12} className="text-accent" />
                    {choice === 'accept' ? 'A personal note (optional)' : 'Send them love (optional)'}
                  </span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="Wishing you a lifetime of love…"
                    className="w-full resize-none rounded-xl border border-accent/30 bg-surface/80 px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>

                {error && <p className="text-sm text-rose">{error}</p>}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-xs uppercase tracking-[0.2em] text-fg-soft hover:text-fg transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!name.trim() || submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-ink disabled:opacity-40 transition hover:bg-gold hover:-translate-y-0.5"
                  >
                    {submitting ? 'Sending…' : 'Confirm'} <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
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
                    : <Heart size={28} className="text-rose" />
                  }
                </motion.div>

                <p className="font-script text-4xl text-accent">
                  {name ? `Thank you, ${name}!` : 'Thank you!'}
                </p>
                <p className="mt-3 text-fg-soft">
                  {choice === 'accept' ? rsvp.acceptThankyou : rsvp.declineThankyou}
                </p>

                {choice === 'accept' && (
                  <p className="mt-2 text-xs text-fg-soft/70">
                    {guests} {guests === 1 ? 'guest' : 'guests'} · {meal || 'No meal preference'}
                  </p>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

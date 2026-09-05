// A `Section` is the wrapper used by every section of the page.
// It gives consistent spacing, an animated heading, and a subtitle.
//
// Props it accepts:
//   id       — anchor for nav links (e.g. "story" → href="#story")
//   title    — big serif heading
//   subtitle — small script subtitle below the title
//   size     — width: 'sm' | 'md' | 'lg'
//   children — whatever you put inside <Section>...</Section>

import { motion } from 'framer-motion';
import { Container } from './Container.jsx';

export function Section({
  id,
  title,
  subtitle,
  children,
  size = 'md',
  className = '',
  showOrnament = true,
}) {
  return (
    <section id={id} className={`relative py-20 sm:py-28 scroll-mt-20 ${className}`}>
      <Container size={size}>
        {/* Heading block (only shown if title or subtitle was passed). */}
        {(title || subtitle) && (
          <motion.div
            // motion.div = a div that can animate.
            // initial = how it looks BEFORE entering the screen
            // whileInView = how it looks once it scrolls into view
            // viewport.once = only animate once, not every time we scroll past
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-14 text-center"
          >
            {title && (
              <h2 className="font-display text-4xl sm:text-5xl tracking-wide">
                {title}
              </h2>
            )}

            {showOrnament && (
              <div className="mt-3 flex justify-center">
                <span className="divider-ornament text-sm tracking-[0.3em] uppercase">
                  ✦
                </span>
              </div>
            )}

            {subtitle && (
              <p className="mt-4 font-script text-2xl text-accent">{subtitle}</p>
            )}
          </motion.div>
        )}

        {children}
      </Container>
    </section>
  );
}

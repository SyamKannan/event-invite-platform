// `Reveal` wraps any children and fades + slides them up when they scroll into
// view. Use it to add a graceful entrance to anything.
//
// Example:
//   <Reveal delay={0.2}>
//     <p>Hello world</p>
//   </Reveal>

import { motion } from 'framer-motion';

export function Reveal({ children, delay = 0, y = 24, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}            // start: invisible, pushed down
      whileInView={{ opacity: 1, y: 0 }}     // end:   visible, in place
      viewport={{ once: true, amount: 0.3 }} // trigger once, when 30% visible
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

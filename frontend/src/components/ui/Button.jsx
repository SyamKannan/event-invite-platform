// A simple Button component.
//
// Two variants: 'primary' (filled gold) and 'outline' (outlined gold).
// Pass `href` to render it as a link, otherwise it renders as a button.

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 ' +
  'text-sm font-medium tracking-wide transition-all duration-300 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';

const variantClasses = {
  primary:
    'bg-accent text-white shadow-[0_8px_24px_-12px_rgb(var(--color-accent)/0.6)] ' +
    'hover:bg-gold hover:shadow-[0_12px_30px_-12px_rgb(var(--color-gold)/0.7)] ' +
    'hover:-translate-y-0.5 active:scale-[0.98]',
  outline:
    'border border-accent/40 text-accent ' +
    'hover:bg-accent hover:text-white hover:-translate-y-0.5',
};

export function Button({
  variant = 'primary',
  href,            // if provided, renders <a> instead of <button>
  className = '',
  children,
  ...rest          // extra props (onClick, type, target, etc.) pass straight through
}) {
  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={finalClassName} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button className={finalClassName} {...rest}>
      {children}
    </button>
  );
}

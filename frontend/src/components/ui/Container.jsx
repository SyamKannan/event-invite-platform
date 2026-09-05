// A `Container` centers its content and limits its max width on big screens.
// Usage:  <Container>...</Container>  or  <Container size="lg">...</Container>

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
};

export function Container({ size = 'md', className = '', children }) {
  return (
    <div className={`mx-auto w-full px-5 sm:px-8 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}

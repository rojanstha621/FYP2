export const Card = ({ children, className = '' }) => (
  <div className={`bg-palette-cream rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${className}`}>
    {children}
  </div>
);

export const Button = ({ type = 'button', variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-palette-mauve text-white hover:bg-palette-dark',
    secondary: 'bg-palette-blush text-palette-dark hover:bg-palette-mauve/90',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    ghost: 'text-palette-mauve hover:bg-palette-cream/60',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export const Input = ({ label, error, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-palette-dark/80 mb-2">{label}</label>}
    <input
      className={`w-full px-4 py-2 border border-palette-cream/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-mauve focus:border-transparent ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    />
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-palette-dark/80 mb-2">{label}</label>}
    <select
      className={`w-full px-4 py-2 border border-palette-cream/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-mauve focus:border-transparent ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-palette-dark/80 mb-2">{label}</label>}
    <textarea
      className={`w-full px-4 py-2 border border-palette-cream/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-mauve focus:border-transparent ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    />
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

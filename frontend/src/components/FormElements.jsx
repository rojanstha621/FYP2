export const Card = ({ children, className = '', ...props }) => (
  <div className={`glass-panel rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${className}`} {...props}>
    {children}
  </div>
);

export const Button = ({ type = 'button', variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const variants = {
    primary: 'text-white bg-gradient-to-r from-palette-mauve to-[#6f4c60] shadow-lg shadow-palette-mauve/20 hover:-translate-y-0.5 hover:shadow-xl',
    secondary: 'text-palette-dark bg-white/80 border border-palette-dark/10 hover:-translate-y-0.5 hover:bg-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-0.5',
    ghost: 'text-palette-mauve hover:bg-palette-mauve/10 hover:text-palette-dark',
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
      className={`input-field ${
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
      className={`input-field ${
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
      className={`input-field min-h-[120px] resize-y ${
        error ? 'border-red-500' : ''
      } ${className}`}
      {...props}
    />
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

import { useEffect } from 'react';

export const Alert = ({ type = 'info', message, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!onClose || !message) return undefined;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, message, duration]);

  const bgColor = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    error: 'bg-rose-50 text-rose-900 border-rose-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-white/95 text-palette-dark border-white/70',
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 z-[1000] w-[min(92vw,420px)] border rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between animate-fade-in-up ${bgColor}`}
      role="alert"
    >
      <span className="pr-4 text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-lg font-bold text-palette-dark/70 hover:text-palette-dark">
          ×
        </button>
      )}
    </div>
  );
};

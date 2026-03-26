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
    success: 'bg-palette-blush text-palette-dark border-palette-mauve',
    error: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    info: 'bg-palette-cream text-palette-dark border-palette-beige',
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 z-[1000] w-[min(92vw,380px)] border rounded-lg p-4 shadow-lg flex items-center justify-between ${bgColor}`}
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

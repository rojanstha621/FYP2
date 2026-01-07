export const Alert = ({ type = 'info', message, onClose }) => {
  const bgColor = {
    success: 'bg-palette-blush text-palette-dark border-palette-mauve',
    error: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    info: 'bg-palette-cream text-palette-dark border-palette-beige',
  }[type];

  return (
    <div
      className={`border rounded-lg p-4 mb-4 flex items-center justify-between ${bgColor}`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-lg font-bold text-palette-dark/70">
          ×
        </button>
      )}
    </div>
  );
};

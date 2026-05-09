export const Spinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 rounded-full border-4 border-palette-mauve/20"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-palette-mauve border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-palette-mauve/20 to-palette-blush/20 blur-sm"></div>
    </div>
  </div>
);

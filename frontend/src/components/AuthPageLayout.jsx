export const AuthPageLayout = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 page-gradient">
    <div className="w-full max-w-md">
      <div className="glass-panel rounded-3xl p-8 border border-palette-mauve/15">
        {children}
      </div>
    </div>
  </div>
);

export const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-palette-beige to-palette-mauve text-palette-dark">
      <main className="flex-1">{children}</main>
    </div>
  );
};

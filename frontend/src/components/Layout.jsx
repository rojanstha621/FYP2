import { Footer } from './Footer';

export const Layout = ({ children }) => {
  return (
    <div className="page-surface relative flex flex-col min-h-screen text-palette-dark">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.24),_rgba(255,255,255,0))]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
      <Footer />
    </div>
  );
};

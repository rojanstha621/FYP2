export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/40 bg-white/55 backdrop-blur-xl text-palette-dark">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-palette-dark mb-4">HealMe</h3>
            <p className="text-palette-dark/70">
              Professional physical therapy management system for guided rehabilitation.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-palette-dark/70">
              <li><a href="#" className="hover:text-palette-mauve transition-all">Home</a></li>
              <li><a href="#" className="hover:text-palette-mauve transition-all">About</a></li>
              <li><a href="#" className="hover:text-palette-mauve transition-all">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-palette-dark/70">
              <li><a href="#" className="hover:text-palette-mauve transition-all">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-palette-mauve transition-all">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-palette-dark/10 pt-6 text-center text-palette-dark/60">
          <p>&copy; {currentYear} HealMe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

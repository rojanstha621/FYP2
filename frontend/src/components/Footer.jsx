export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-palette-dark text-palette-cream py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-palette-blush mb-4">PT Manager</h3>
            <p className="text-palette-cream/80">
              Professional physical therapy management system for guided rehabilitation.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-palette-cream/80">
              <li><a href="#" className="hover:text-palette-mauve transition-all">Home</a></li>
              <li><a href="#" className="hover:text-palette-mauve transition-all">About</a></li>
              <li><a href="#" className="hover:text-palette-mauve transition-all">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-palette-cream/80">
              <li><a href="#" className="hover:text-palette-mauve transition-all">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-palette-mauve transition-all">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-palette-cream/20 pt-6 text-center text-palette-cream/80">
          <p>&copy; {currentYear} PT Manager. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

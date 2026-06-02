import { Link } from "react-router-dom";

export const AppFooter = () => {
  return (
    <footer className="border-t border-border bg-background px-6 py-6 mt-auto">
      <div className="max-w-screen-xl mx-auto space-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link to="/cookie-policy" className="hover:text-foreground transition-colors">
            Cookie Policy
          </Link>
          <Link to="/contact-us" className="hover:text-foreground transition-colors">
            Contact Us
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 The Primrose Review. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
          The Primrose Review provides educational guidance, feedback, and admissions support tools.
          We do not guarantee admission, scholarships, interviews, or acceptance to any educational institution.
        </p>
      </div>
    </footer>
  );
};

import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
        <p className="text-sm text-muted-foreground mb-10">We're here to help.</p>

        <div className="space-y-8">

          <div className="border border-border rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Support</h2>
                <p className="text-sm text-muted-foreground">For platform questions, feedback, and technical issues</p>
              </div>
            </div>
            <a
              href="mailto:team@primrosecrm.com"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              team@primrosecrm.com
            </a>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">About The Primrose Review</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Primrose Review is an educational technology platform designed to support students
              throughout the college admissions process. We provide personalized guidance, feedback,
              and AI-assisted tools to help students put their best foot forward.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We do not guarantee admission, scholarships, interviews, or acceptance to any
              educational institution.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Legal</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
              <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUs;

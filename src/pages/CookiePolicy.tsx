import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const CookiePolicy = () => {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective date: January 1, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help
              websites remember your preferences and improve your experience across sessions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">The Primrose Review uses cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Maintain your authenticated session so you stay logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how users interact with the platform (analytics)</li>
              <li>Improve platform performance and reliability</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground">Essential Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mt-1">
                  Required for the platform to function. These include authentication tokens managed
                  by Supabase. You cannot opt out of these without affecting platform functionality.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Analytics Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mt-1">
                  Used to understand usage patterns and improve the platform. These do not identify
                  you personally.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use trusted third-party services (such as analytics providers) that set their
              own cookies. We do not control these cookies directly. We do not use third-party
              advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can control cookies through your browser settings. Disabling cookies may affect
              your ability to log in and use platform features. For instructions on managing cookies,
              refer to your browser's help documentation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about our use of cookies, contact us at{" "}
              <a href="mailto:support@theprimrosereview.com" className="text-primary hover:underline">
                support@theprimrosereview.com
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;

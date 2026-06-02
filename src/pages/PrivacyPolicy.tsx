import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective date: January 1, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Primrose Review collects and processes information submitted by users in the course of using our platform, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Account information (name, email address, role)</li>
              <li>Essays and written submissions</li>
              <li>Activities, resumes, and profile information</li>
              <li>School and program preferences</li>
              <li>Challenge submissions</li>
              <li>Interview and conversation responses</li>
              <li>Usage and analytics information</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Provide personalized feedback and platform features</li>
              <li>Improve platform recommendations</li>
              <li>Power AI-assisted educational tools</li>
              <li>Enhance the student experience</li>
              <li>Improve platform performance and security</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Student Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Student essays, profiles, and submissions may be processed by AI systems to generate personalized
              feedback and recommendations. The Primrose Review does not claim ownership of student work.
              Students retain ownership of their submitted content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Third Parties</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell personal information to third parties. We may share information with trusted
              service providers who assist us in operating the platform, subject to confidentiality obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">AI Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Primrose Review uses artificial intelligence to provide feedback, suggestions, insights,
              and recommendations. AI-generated content is intended for educational purposes only and should
              not be considered professional admissions, legal, academic, or financial advice. Users are
              encouraged to exercise independent judgment when making application decisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about this Privacy Policy, please contact us at{" "}
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

export default PrivacyPolicy;

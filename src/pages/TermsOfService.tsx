import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective date: January 1, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Primrose Review is an educational technology platform designed to support students
              throughout the admissions process. By accessing or using our platform, you agree to the
              terms described below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Platform Use</h2>
            <p className="text-muted-foreground leading-relaxed">By using the platform, users agree that:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>The Primrose Review provides guidance and feedback only</li>
              <li>Admissions decisions remain solely with educational institutions</li>
              <li>The Primrose Review does not guarantee admissions outcomes</li>
              <li>Users are responsible for the accuracy of submitted information</li>
              <li>Users may not misuse or disrupt the platform</li>
              <li>Platform features may change over time</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">AI-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Primrose Review uses artificial intelligence to provide feedback, suggestions, insights,
              and recommendations. AI-generated content is intended for educational purposes only and should
              not be considered professional admissions, legal, academic, or financial advice. Users are
              encouraged to exercise independent judgment when making application decisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Student Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              Students retain ownership of their essays, profiles, and submitted work. By submitting
              content to the platform, users grant The Primrose Review a limited license to process
              that content solely for the purpose of delivering the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Challenges and Competitions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Participation in challenges, competitions, or giveaways is subject to separate challenge
              rules. The Primrose Review reserves the right to select winners, modify challenge timelines,
              or cancel challenges when necessary.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Primrose Review provides educational guidance, feedback, and admissions support tools.
              We do not guarantee admission, scholarships, interviews, or acceptance to any educational institution.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us at{" "}
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

export default TermsOfService;

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, CheckCircle, Clock, AlertTriangle,
  BookOpen, TrendingUp, Trophy,
  ChevronDown, ChevronUp, Star, Calendar, Zap, Shield,
  Hourglass, FileText, Award,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useParentPortalData } from "@/hooks/useParentPortalData";

// ── Helpers ───────────────────────────────────────────────────────────────────

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

const strategyStyle = (s: string) => {
  if (s === "Reach")  return { badge: "bg-red-100 text-red-700 border-red-200", init: "bg-red-100 text-red-700" };
  if (s === "Target") return { badge: "bg-purple-100 text-purple-700 border-purple-200", init: "bg-purple-100 text-purple-700" };
  return               { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", init: "bg-emerald-100 text-emerald-700" };
};

const statusStyle = (s: string) => {
  if (s === "Submitted")       return "bg-green-100 text-green-700 border border-green-200";
  if (s === "Ready to Submit") return "bg-blue-100 text-blue-700 border border-blue-200";
  if (s === "Essay Review")    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  if (s === "In Progress")     return "bg-orange-100 text-orange-700 border border-orange-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
};

const urgencyBar = (level: "red" | "amber" | "green") => ({
  red:   { bar: "bg-red-500",     icon: <AlertTriangle className="h-4 w-4 text-red-500" />,     bg: "bg-red-50 border-red-100" },
  amber: { bar: "bg-amber-500",   icon: <Clock className="h-4 w-4 text-amber-500" />,           bg: "bg-amber-50 border-amber-100" },
  green: { bar: "bg-emerald-500", icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,   bg: "bg-emerald-50 border-emerald-100" },
}[level]);

// ── Coming Soon placeholder ───────────────────────────────────────────────────
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
        <Hourglass className="h-5 w-5 text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">Coming Soon</p>
        <p className="text-xs text-slate-400 mt-0.5">{label} will appear here once available.</p>
      </div>
    </div>
  );
}

// ── Strength Profile ──────────────────────────────────────────────────────────

interface StrengthProfileProps {
  gpa: string | number | null;
  satScore: string | number | null;
  actScore: string | number | null;
  essaysCompleted: number;
  totalEssays: number;
  recsCompleted: number;
  totalRecs: number;
  overallProgress: number;
  universities: { strategy: string }[];
}

function StrengthProfile({
  gpa, satScore, actScore,
  essaysCompleted, totalEssays,
  recsCompleted, totalRecs,
  overallProgress,
  universities,
}: StrengthProfileProps) {
  // Academic score: GPA normalized 2.0→25 to 4.0→100, plus optional test score bonus
  const gpaVal = gpa != null ? parseFloat(String(gpa)) : null;
  const satVal = satScore != null ? parseInt(String(satScore)) : null;
  const actVal = actScore != null ? parseInt(String(actScore)) : null;

  let academicScore: number | null = null;
  if (gpaVal !== null && !isNaN(gpaVal)) {
    const base = Math.round(Math.min(100, Math.max(20, ((gpaVal - 2.0) / 2.0) * 80 + 20)));
    if (satVal && !isNaN(satVal)) {
      academicScore = Math.min(100, base + Math.round(((satVal - 400) / 1200) * 15));
    } else if (actVal && !isNaN(actVal)) {
      academicScore = Math.min(100, base + Math.round(((actVal - 1) / 35) * 15));
    } else {
      academicScore = base;
    }
  }

  const essayScore  = totalEssays > 0 ? Math.round((essaysCompleted / totalEssays) * 100) : null;
  const recScore    = totalRecs   > 0 ? Math.round((recsCompleted   / totalRecs)   * 100) : null;
  const appScore    = overallProgress > 0 ? overallProgress : null;

  const reachCount  = universities.filter(u => u.strategy === "Reach").length;
  const targetCount = universities.filter(u => u.strategy === "Target").length;
  const safetyCount = universities.filter(u => u.strategy === "Safety").length;

  const barColor = (s: number | null) => {
    if (s === null) return "bg-slate-200";
    if (s >= 80)   return "bg-emerald-500";
    if (s >= 65)   return "bg-teal-500";
    if (s >= 45)   return "bg-amber-400";
    return "bg-red-400";
  };

  const statusLabel = (s: number | null): { text: string; cls: string } => {
    if (s === null) return { text: "No data",    cls: "text-slate-400 bg-slate-50 border-slate-200" };
    if (s >= 80)   return { text: "Strong",      cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (s >= 65)   return { text: "On Track",    cls: "text-teal-700 bg-teal-50 border-teal-200" };
    if (s >= 45)   return { text: "In Progress", cls: "text-amber-700 bg-amber-50 border-amber-200" };
    return              { text: "Needs Work",    cls: "text-red-700 bg-red-50 border-red-200" };
  };

  const dimensions = [
    {
      label: "Academic Strength",
      score: academicScore,
      detail: gpaVal != null
        ? `GPA ${gpaVal.toFixed(2)}${satVal ? ` · SAT ${satVal}` : actVal ? ` · ACT ${actVal}` : ""}`
        : "GPA not on file",
      icon: <GraduationCap className="h-4 w-4 text-violet-500" />,
    },
    {
      label: "Essay Progress",
      score: essayScore,
      detail: totalEssays > 0 ? `${essaysCompleted} of ${totalEssays} essays complete` : "No essays on file",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
    },
    {
      label: "Recommendations",
      score: recScore,
      detail: totalRecs > 0 ? `${recsCompleted} of ${totalRecs} letters secured` : "None requested yet",
      icon: <Award className="h-4 w-4 text-pink-500" />,
    },
    {
      label: "App Readiness",
      score: appScore,
      detail: "Average completion across all schools",
      icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
    },
  ];

  return (
    <div className="space-y-5">
      {dimensions.map((dim, i) => {
        const sl = statusLabel(dim.score);
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {dim.icon}
                <span className="text-sm font-semibold text-foreground">{dim.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sl.cls}`}>
                  {sl.text}
                </span>
                <span className="text-sm font-bold text-foreground w-9 text-right tabular-nums">
                  {dim.score != null ? `${dim.score}%` : "—"}
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor(dim.score)}`}
                style={{ width: dim.score != null ? `${dim.score}%` : "0%" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{dim.detail}</p>
          </div>
        );
      })}

      {universities.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            College List Balance
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Reach",  count: reachCount,  bg: "bg-red-50",     border: "border-red-100",    num: "text-red-700",     sub: "text-red-400" },
              { label: "Target", count: targetCount, bg: "bg-purple-50",  border: "border-purple-100", num: "text-purple-700",  sub: "text-purple-400" },
              { label: "Safety", count: safetyCount, bg: "bg-emerald-50", border: "border-emerald-100",num: "text-emerald-700", sub: "text-emerald-400" },
            ].map(({ label, count, bg, border, num, sub }) => (
              <div key={label} className={`${bg} border ${border} rounded-xl py-3 text-center`}>
                <p className={`text-xl font-bold ${num}`}>{count}</p>
                <p className={`text-xs font-medium ${sub} mt-0.5`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Learning content ──────────────────────────────────────────────────────────
const LESSONS = [
  {
    id: "admissions",
    title: "How College Admissions Works",
    tag: "Start here",
    readTime: "8 min read",
    gradient: "from-violet-500 to-purple-600",
    emoji: "🎓",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">
          Most selective universities use what's called <strong>holistic review</strong> — admissions officers look at the whole student, not just a GPA or test score. Understanding how this process actually works can help you support your child without adding unnecessary pressure.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">What goes into a holistic application?</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li><strong>Academic performance:</strong> Grades and course rigor are the most important factor. Admissions officers want to see that students challenged themselves — an A in AP Chemistry means more than an A in a standard course. Grade trends matter too: improving grades junior year can offset a weaker freshman year.</li>
          <li><strong>Standardized testing:</strong> Many universities are now test-optional or test-free, but strong scores still help at test-optional schools. If your child has a 1500+ SAT or 34+ ACT, submitting it will likely help. If not, research each school's policy before deciding.</li>
          <li><strong>Essays:</strong> The personal statement and supplemental essays give your child a voice in the application. Admissions officers read thousands of essays — they're looking for something human, not something impressive. This is one area where parents should step back and let the student lead.</li>
          <li><strong>Extracurricular activities:</strong> Quality over quantity. Four years of sustained commitment to one or two activities tells a stronger story than a long list of short-term clubs. Colleges want to understand who your child is outside the classroom.</li>
          <li><strong>Recommendation letters:</strong> Two teacher letters and a counselor letter are standard. Teachers who know your child well — not just the ones who gave the highest grade — tend to write the most compelling letters.</li>
          <li><strong>Demonstrated interest:</strong> Some schools track whether students have visited, attended info sessions, or emailed admissions. It signals genuine fit, not just a safety school mentality.</li>
        </ul>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">How applications are actually read</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          At most schools, each application gets at least two reads. A regional admissions officer reviews it first, then a committee makes the final call. Readers spend roughly 8–12 minutes per application at peak season. The goal is to find students who would thrive at that specific school — fit matters as much as achievement.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">Decision types explained</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><strong>Accepted:</strong> Offered admission. Your child has until May 1 (National Candidates Reply Date) to decide.</li>
          <li><strong>Waitlisted:</strong> Not admitted now, but could be offered a spot if admitted students decline. Odds vary widely by school and year.</li>
          <li><strong>Deferred:</strong> An early applicant whose decision is moved to the regular decision pool. Still fully in consideration — not a soft rejection.</li>
          <li><strong>Denied:</strong> Not offered admission this cycle. Disappointing, but rarely the end of the story. Many students thrive at their second-choice school.</li>
        </ul>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">How you can help</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The most effective thing parents can do is stay calm. Your child is already under significant pressure. Expressing confidence in them — regardless of outcomes — makes a measurable difference. Help with logistics (deadlines, documents, financial aid forms) rather than content. And remind them that where they go matters far less than what they do once they get there.
        </p>
      </>
    ),
  },
  {
    id: "essay",
    title: "What Makes a Strong Essay",
    tag: "High impact",
    readTime: "7 min read",
    gradient: "from-pink-500 to-rose-600",
    emoji: "✍️",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">
          The college essay is one of the most misunderstood parts of the application. Parents often want their child to write something impressive — to talk about a big achievement, a leadership role, or a meaningful mission trip. Admissions officers have read thousands of those. What actually stands out is something far simpler: a student writing honestly about something true.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">What admissions officers are actually looking for</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The essay answers one question the rest of the application can't: <em>Who is this person?</em> Officers want to hear the student's voice — how they think, what they notice, what matters to them. A well-written essay about learning to cook with a grandmother can be more compelling than a generic essay about founding a club.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">The five qualities of a strong essay</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li><strong>Authenticity:</strong> Admissions officers can tell when an essay has been heavily edited by a parent or tutor. The goal isn't a perfectly polished essay — it's an honest one. Awkward sentences with real voice beat flawless prose with no personality.</li>
          <li><strong>Specific detail:</strong> "I love helping people" means nothing. "I spent six months teaching my grandfather to use FaceTime so he could see my sister graduate" means everything. Concrete, specific moments do the work that abstract statements can't.</li>
          <li><strong>Reflection:</strong> The event itself is rarely what the essay is about — it's what the student learned, how they changed, or what they now see differently. Self-awareness and maturity are what officers are looking for, not an impressive résumé of experiences.</li>
          <li><strong>Voice:</strong> The essay should sound like the student — not like a formal academic paper and not like a corporate cover letter. If your child speaks casually, some of that should come through. If they're funny, the essay can be too.</li>
          <li><strong>Focus:</strong> One idea explored deeply beats five ideas covered shallowly. The best essays stay close to a single moment, theme, or insight. Trying to cover everything produces an essay that says nothing.</li>
        </ul>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">Common topics — and what makes them work or fail</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sports injuries, immigrant family stories, and mission trips are among the most common essay topics. None of these are inherently bad — but they require a genuinely personal angle to succeed. The question isn't <em>what happened</em>, it's <em>what does this reveal about how this specific student sees the world</em>?
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">How parents can help (and what to avoid)</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><strong>Do:</strong> Read a draft and share how it made you feel as a reader — not whether it's impressive, but whether you learned something new about your child.</li>
          <li><strong>Do:</strong> Ask questions: "What do you want the admissions officer to remember about you after reading this?"</li>
          <li><strong>Don't:</strong> Rewrite sentences or suggest specific stories. The moment the essay sounds like you, it stops being their application.</li>
          <li><strong>Don't:</strong> Compare their draft to essays you've read online. Every student's voice is different, and the published "successful" essays often aren't representative.</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          The best thing you can do is create space for your child to write — and then get out of the way.
        </p>
      </>
    ),
  },
  {
    id: "financial-aid",
    title: "Financial Aid Explained",
    tag: "Essential reading",
    readTime: "8 min read",
    gradient: "from-emerald-500 to-teal-600",
    emoji: "💰",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">
          The sticker price of a university is almost never what families actually pay. Understanding how financial aid works — and acting on it early — can make an enormous difference to what college ultimately costs your family.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">The two forms you need to know</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li><strong>FAFSA (Free Application for Federal Student Aid):</strong> Required by virtually every US university. Opens October 1 for the following academic year. Based on your tax return from two years prior (e.g., 2024–25 uses 2022 taxes). File as early as possible — some aid is first-come, first-served. Completing the FAFSA is free.</li>
          <li><strong>CSS Profile:</strong> Required by ~400 private colleges in addition to the FAFSA. More detailed than the FAFSA — it factors in home equity, retirement assets, and non-custodial parent income. Each school receives the profile separately, and some charge a fee per submission. Check each school's financial aid page to confirm requirements.</li>
        </ul>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">Types of aid — and the critical difference</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li><strong>Grants and institutional aid:</strong> Free money from the university — the largest and most valuable form of aid. Does not need to be repaid. Highly selective schools with large endowments (Harvard, Princeton, MIT, etc.) often meet 100% of demonstrated financial need. Don't assume these schools are unaffordable — they may be less expensive than lower-ranked alternatives for your family.</li>
          <li><strong>Federal grants (Pell Grant):</strong> Need-based federal money for lower-income families. Up to ~$7,000/year. Also does not need to be repaid.</li>
          <li><strong>Merit scholarships:</strong> Awarded for academic achievement, talent, or other criteria — not based on financial need. Some schools use merit aid aggressively to attract high-achieving students. Others (including most Ivies) offer need-based aid only.</li>
          <li><strong>Work-study:</strong> A federal program allowing students to earn money through part-time jobs, usually on campus. The amount is limited but can supplement other aid.</li>
          <li><strong>Loans:</strong> Must be repaid with interest. Federal loans (Stafford, PLUS) are generally more favorable than private loans. Minimize borrowing where possible — but don't let fear of loans cause your child to turn down a better opportunity.</li>
        </ul>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">Understanding your financial aid offer</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When offers arrive in March/April, compare them carefully. Look at the <em>net price</em> (total cost minus grants and scholarships) — not the sticker price. Two schools with very different list prices may cost your family the same amount. Be wary of offers that include large loan amounts labeled as "aid" — loans increase the apparent generosity of the package without actually reducing your cost.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">Can you negotiate?</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Yes — many families don't know this. If your financial circumstances changed since filing taxes (job loss, medical expenses, divorce), contact each school's financial aid office and explain. Schools can issue a "professional judgment" adjustment. If your child is admitted to multiple schools, you can also ask schools to match a more competitive offer from a peer institution. Be polite, specific, and provide documentation. It doesn't always work — but it often does.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">Key deadlines to track</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Financial aid deadlines are often earlier than application deadlines — sometimes by weeks. Missing the priority financial aid deadline at a school can mean significantly less money, even if your child is admitted. Add each school's financial aid deadline to your family calendar as soon as applications are submitted.
        </p>
      </>
    ),
  },
  {
    id: "early-decision",
    title: "Early Decision vs Regular Decision",
    tag: "Strategy guide",
    readTime: "7 min read",
    gradient: "from-amber-500 to-orange-600",
    emoji: "📅",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">
          One of the most consequential decisions in the application process is <em>when</em> to apply — not just <em>where</em>. The timing options each carry different implications for admission odds, financial flexibility, and stress management.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">The full menu of timing options</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li><strong>Early Decision I (ED I):</strong> Apply by early November; decision by mid-December. If admitted, enrollment is <em>legally binding</em> — your child must withdraw all other applications and attend. ED I acceptance rates are often meaningfully higher than regular decision rates at the same school, because demonstrated commitment is valuable to admissions. Only use ED I if a school is genuinely your child's first choice and your family can afford it without comparing financial aid offers.</li>
          <li><strong>Early Decision II (ED II):</strong> Same binding commitment, but with a January deadline and February decision. A good option if your child needs more time to find their first choice, or if they were deferred or rejected by their ED I school.</li>
          <li><strong>Early Action (EA):</strong> Apply early (October–November), hear back by December–January, but the decision is <em>not binding</em>. Your child can still apply to other schools and has until May 1 to decide. Many strong students apply EA wherever it's available — there's little downside.</li>
          <li><strong>Restrictive Early Action (REA) / Single-Choice Early Action:</strong> Offered by a small number of schools (Harvard, Yale, Stanford, Princeton). Non-binding, but students agree not to apply ED or EA anywhere else. An important restriction to understand before applying.</li>
          <li><strong>Regular Decision (RD):</strong> Standard January 1–15 deadlines. Decisions arrive March–April. Gives students maximum flexibility to compare schools, wait-and-see on grades, and evaluate financial aid packages side-by-side before committing.</li>
          <li><strong>Rolling Admissions:</strong> Some schools (many public universities) review applications as they arrive and notify students within weeks. Applying early under rolling admissions is almost always advantageous — spots fill over time.</li>
        </ul>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">The financial risk of Early Decision</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is the part families most often overlook. By committing to attend before seeing a financial aid offer, you give up your ability to compare packages or negotiate with competing schools. Most ED agreements do include a financial hardship clause — if the aid package makes attendance genuinely impossible, you may be released from the commitment. But the bar is high. Talk honestly with your child and their counselor about whether ED is the right financial decision for your family before applying.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">Building a balanced timeline</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Most students apply to 10–15 schools across three categories: reach, target, and safety. A strong strategy might include one ED or EA application to a first-choice school, several EA applications to well-matched targets, and a few RD applications to safety schools where the student would genuinely be happy. Spreading deadlines reduces the November crunch and gives your child more processing time for each application.
        </p>

        <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">What parents should watch for</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Watch for schools your child added for prestige rather than genuine fit — these rarely produce satisfying outcomes even when admitted.</li>
          <li>Make sure your child understands the binding nature of ED before applying — some students apply without fully appreciating what they're committing to.</li>
          <li>Don't push for ED at a school primarily because the acceptance rate looks better. The higher rate reflects student commitment, not a strategic shortcut.</li>
          <li>A balanced list with a few genuine safeties is more important than optimizing every early deadline. Uncertainty is part of this process — help your child sit with it rather than try to eliminate it.</li>
        </ul>
      </>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const ParentPortal = () => {
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  const live = useParentPortalData();

  // Only use real data — no mock fallbacks
  const firstName  = live.studentProfile?.full_name?.split(" ")[0] ?? "Your child";
  const fullName   = live.studentProfile?.full_name ?? "";
  const schoolName = live.schoolName ?? "";
  const grade      = live.studentAcademics?.grade ?? "";
  const gpa        = live.studentAcademics?.gpa ?? null;
  const satScore   = live.studentAcademics?.sat_score ?? null;

  const overallProgress      = live.hasStudent ? live.overallProgress : 0;
  const journeyStages        = live.hasStudent ? live.journeyStages : [];
  const completedStageCount  = journeyStages.filter(s => s.completed).length;

  const essaysCompleted = live.hasStudent ? live.completedEssays : 0;
  const totalEssays     = live.hasStudent ? live.essays.length : 0;
  const appsSubmitted   = live.hasStudent ? live.submittedApps : 0;
  const totalApps       = live.hasStudent ? live.applications.length : 0;
  const recsCompleted   = live.hasStudent ? live.completedRecs : 0;
  const totalRecs       = live.hasStudent ? live.recommendations.length : 0;

  const universities = live.hasStudent
    ? live.applications.map(a => ({
        name: a.school_name,
        appType: a.application_type,
        status: a.status,
        deadline: a.deadline_date,
        strategy: a.ai_score_avg != null
          ? a.ai_score_avg < 40 ? "Reach" : a.ai_score_avg < 70 ? "Target" : "Safety"
          : "Target",
        completionPct: a.completion_percentage ?? 0,
        remaining: a.completed_essays < a.required_essays
          ? [`${a.required_essays - a.completed_essays} essay(s) remaining`]
          : [],
      }))
    : [];

  const urgencyItems = live.hasStudent
    ? [
        ...live.urgentApps.map(a => ({
          text: `${a.school_name} application`,
          sub: `${new Date(a.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${daysUntil(a.deadline_date)} days left`,
          level: "red" as const,
        })),
        ...live.warningApps.map(a => ({
          text: `${a.school_name} application`,
          sub: `${new Date(a.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${daysUntil(a.deadline_date)} days left`,
          level: "amber" as const,
        })),
      ]
    : [];

  const weekActivity = live.hasStudent
    ? [
        ...live.thisWeekSubmitted.map(a => ({
          text: `${a.school_name} application submitted`,
          date: new Date(a.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          type: "success" as const,
        })),
        ...live.thisWeekEssays.map(e => ({
          text: `"${e.essay_title}" essay updated`,
          date: new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          type: "progress" as const,
        })),
      ]
    : [];

  const chartData = universities.map(u => ({
    name: u.name.length > 24 ? u.name.slice(0, 22) + "…" : u.name,
    completion: u.completionPct,
    strategy: u.strategy,
  }));

  const CIRC      = 2 * Math.PI * 38;
  const strokeDash = (overallProgress / 100) * CIRC;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-900 p-8 text-white">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            {live.hasStudent ? (
              <>
                <p className="text-violet-300 text-sm font-medium mb-1 tracking-wide uppercase">
                  {schoolName}{grade ? ` · ${grade}` : ""}
                </p>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3 leading-tight">
                  Guiding {firstName} toward their future.
                </h1>
                <p className="text-violet-200 text-base max-w-lg leading-relaxed">
                  A clearer, calmer admissions journey — for students and families. Here's where things stand today.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-300 text-sm font-semibold">On Track</span>
                  </div>
                  {gpa && (
                    <span className="text-violet-300 text-sm bg-white/10 rounded-full px-3 py-1">GPA {gpa}</span>
                  )}
                  {satScore && (
                    <span className="text-violet-300 text-sm bg-white/10 rounded-full px-3 py-1">SAT {satScore}</span>
                  )}
                  <span className="text-violet-300 text-sm">
                    {appsSubmitted} of {totalApps} applications submitted
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-violet-300 text-sm font-medium mb-1 tracking-wide uppercase">Parent Portal</p>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3 leading-tight">
                  Welcome to your parent dashboard.
                </h1>
                <p className="text-violet-200 text-base max-w-lg leading-relaxed">
                  Once your child's account is linked, you'll see their full application progress here.
                </p>
              </>
            )}
          </div>

          {/* Progress ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <svg className="w-28 h-28 drop-shadow-lg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="38" fill="none"
                stroke="white" strokeWidth="8"
                strokeDasharray={`${strokeDash} ${CIRC}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
              <text x="50" y="45" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="inherit">
                {live.hasStudent ? `${overallProgress}%` : "—"}
              </text>
              <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="inherit">
                {live.hasStudent ? "Complete" : "Pending"}
              </text>
            </svg>
            <p className="text-violet-300 text-xs text-center">Overall progress</p>
          </div>
        </div>
      </div>

      {/* ── Journey Roadmap ── */}
      <Card className="p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">{firstName}'s Admissions Journey</h3>
            <p className="text-sm text-muted-foreground">
              {live.hasStudent ? `${completedStageCount} of ${journeyStages.length} milestones reached` : "Milestones will appear once linked"}
            </p>
          </div>
          {live.hasStudent && (
            <Badge variant="outline" className="text-violet-600 border-violet-200 bg-violet-50 font-medium">
              Class of {live.studentAcademics?.graduation_year ?? "—"}
            </Badge>
          )}
        </div>

        {live.hasStudent && journeyStages.length > 0 ? (
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-px bg-slate-200" />
            <div
              className="absolute top-5 left-5 h-px bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
              style={{ width: `calc(${(completedStageCount / Math.max(journeyStages.length - 1, 1)) * 100}% - 2.5rem)` }}
            />
            <div className="flex justify-between relative">
              {journeyStages.map((stage, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                    stage.completed
                      ? "bg-violet-600 border-violet-600 shadow-md shadow-violet-200"
                      : i === completedStageCount
                      ? "bg-white border-violet-400 ring-2 ring-violet-200"
                      : "bg-white border-slate-300"
                  }`}>
                    {stage.completed
                      ? <CheckCircle className="h-5 w-5 text-white" />
                      : <span className={`text-xs font-bold ${i === completedStageCount ? "text-violet-500" : "text-slate-400"}`}>{i + 1}</span>
                    }
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight max-w-[64px] ${
                    stage.completed ? "text-violet-700" : i === completedStageCount ? "text-violet-500" : "text-slate-400"
                  }`}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ComingSoon label="Journey milestones" />
        )}
      </Card>

      {/* ── Stats Row ── */}
      {live.hasStudent ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Essays",       value: `${essaysCompleted}/${totalEssays}`, sub: "completed",    icon: <BookOpen className="h-5 w-5" />,      bg: "bg-violet-50", accent: "text-violet-600", ring: "border-violet-100" },
            { label: "Applications", value: `${appsSubmitted}/${totalApps}`,     sub: "submitted",    icon: <GraduationCap className="h-5 w-5" />, bg: "bg-blue-50",   accent: "text-blue-600",   ring: "border-blue-100" },
            { label: "Rec Letters",  value: `${recsCompleted}/${totalRecs}`,     sub: "secured",      icon: <Star className="h-5 w-5" />,          bg: "bg-pink-50",   accent: "text-pink-600",   ring: "border-pink-100" },
            { label: "Attention",    value: urgencyItems.filter(u => u.level === "red").length.toString(), sub: "items urgent", icon: <Zap className="h-5 w-5" />, bg: "bg-amber-50", accent: "text-amber-600", ring: "border-amber-100" },
          ].map((stat, i) => (
            <Card key={i} className={`p-5 rounded-2xl border ${stat.ring} shadow-sm ${stat.bg}`}>
              <div className={`${stat.accent} mb-3`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label} {stat.sub}</p>
            </Card>
          ))}
        </div>
      ) : (
        <ComingSoon label="Application stats" />
      )}

      {/* ── Needs Attention ── */}
      <Card className="p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Needs Attention
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Items that need action in the near term.</p>

        {!live.hasStudent ? (
          <ComingSoon label="Urgent action items" />
        ) : urgencyItems.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-medium text-emerald-700">Nothing urgent right now — {firstName} is on top of things.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {urgencyItems.map((item, i) => {
              const u = urgencyBar(item.level);
              return (
                <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${u.bg}`}>
                  <div className="shrink-0 mt-0.5">{u.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                  <div className={`w-1.5 h-full min-h-[2rem] rounded-full ${u.bar} self-stretch shrink-0`} />
                </div>
              );
            })}
          </div>
        )}

        {live.hasStudent && (
          <div className="mt-5 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">You're On Track</p>
            </div>
            <p className="text-xs text-emerald-600 leading-relaxed">
              {firstName}'s timeline is progressing well. Keep the momentum going.
            </p>
          </div>
        )}
      </Card>

      {/* ── University Tracker ── */}
      <Card className="p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-violet-500" />
              University List
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {fullName ? `${fullName}'s full college application list` : "College application list"}
            </p>
          </div>
          {live.hasStudent && universities.length > 0 && (
            <div className="flex gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">Reach</span>
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">Target</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">Safety</span>
            </div>
          )}
        </div>

        {!live.hasStudent || universities.length === 0 ? (
          <ComingSoon label="University list" />
        ) : (
          <div className="space-y-3">
            {universities.map((uni: typeof universities[number], i: number) => {
              const ss = strategyStyle(uni.strategy);
              const days = daysUntil(uni.deadline);
              const initials = uni.name.split(" ").map((w: string) => w[0]).filter((_: string, idx: number) => idx < 2).join("");
              return (
                <div key={i} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${ss.init} flex items-center justify-center shrink-0 font-bold text-base`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{uni.name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ss.badge}`}>{uni.strategy}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle(uni.status)}`}>{uni.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(uni.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {uni.status !== "Submitted" && days >= 0 && (
                            <span className={`font-semibold ml-1 ${days <= 7 ? "text-red-500" : days <= 14 ? "text-amber-500" : "text-slate-500"}`}>
                              · {days}d left
                            </span>
                          )}
                        </span>
                        {uni.appType && <span className="bg-slate-100 rounded px-1.5 py-0.5 font-medium text-slate-600">{uni.appType}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={uni.completionPct} className="h-1.5 flex-1" />
                        <span className="text-xs font-semibold text-muted-foreground shrink-0 w-8 text-right">{uni.completionPct}%</span>
                      </div>
                      {uni.remaining.length > 0 && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {uni.remaining.join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Application Progress Chart ── */}
      {live.hasStudent && universities.length > 0 && (
        <Card className="p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              Application Progress
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Completion across {firstName}'s {universities.length} school{universities.length !== 1 ? "s" : ""}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(universities.length * 52, 80)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Completion"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="completion" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.strategy === "Reach"  ? "#f87171" :
                      entry.strategy === "Safety" ? "#34d399" :
                                                    "#a78bfa"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-4 text-xs text-muted-foreground">
            {["Reach", "Target", "Safety"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${s === "Reach" ? "bg-red-400" : s === "Target" ? "bg-violet-400" : "bg-emerald-400"}`} />
                {s}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ── Weekly Snapshot + Strength Profile ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Snapshot */}
        <Card className="p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            This Week
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Recent activity in {firstName}'s application process.</p>

          {!live.hasStudent ? (
            <ComingSoon label="Weekly activity" />
          ) : weekActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No activity from {firstName} this week yet — check back soon.</p>
          ) : (
            <div className="space-y-2.5">
              {weekActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.type === "success" ? "bg-emerald-500" : "bg-blue-400"}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Strength Profile */}
        <Card className="p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            {firstName}'s Strength Profile
          </h3>
          <p className="text-sm text-muted-foreground mb-5">How {firstName} is positioning for admissions.</p>
          {live.hasStudent ? (
            <StrengthProfile
              gpa={live.studentAcademics?.gpa ?? null}
              satScore={live.studentAcademics?.sat_score ?? null}
              actScore={live.studentAcademics?.act_score ?? null}
              essaysCompleted={essaysCompleted}
              totalEssays={totalEssays}
              recsCompleted={recsCompleted}
              totalRecs={totalRecs}
              overallProgress={overallProgress}
              universities={universities}
            />
          ) : (
            <ComingSoon label="Strength profile data" />
          )}
        </Card>
      </div>

      {/* ── Parent Insights — coming soon ── */}
      <Card className="p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Parent Insights</h3>
            <p className="text-xs text-muted-foreground">AI-generated weekly summary</p>
          </div>
        </div>
        <ComingSoon label="AI-generated parent insights" />
      </Card>

      {/* ── Learning Center ── */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-500" />
            Parent Learning Center
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Guides to help you support {firstName} through the admissions process.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LESSONS.map(lesson => (
            <Card key={lesson.id} className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${lesson.gradient} p-5 text-white`}>
                <div className="text-3xl mb-2">{lesson.emoji}</div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold leading-snug">{lesson.title}</h4>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-white/20 rounded-full px-2.5 py-0.5 font-medium">{lesson.tag}</span>
                  <span className="text-xs text-white/70">{lesson.readTime}</span>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
                onClick={() => setOpenLesson(openLesson === lesson.id ? null : lesson.id)}
              >
                <span>{openLesson === lesson.id ? "Close guide" : "Read guide"}</span>
                {openLesson === lesson.id
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {openLesson === lesson.id && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 bg-white">
                  {lesson.content}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ParentPortal;
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
    readTime: "6 min read",
    gradient: "from-violet-500 to-purple-600",
    emoji: "🎓",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">
          Most universities follow <strong>holistic review</strong> — admissions officers evaluate several parts of the application together rather than relying on a single number.
        </p>
        <ul className="space-y-2 mt-3 text-base text-muted-foreground">
          <li><strong>Academic performance:</strong> Grades remain the most important factor.</li>
          <li><strong>Standardized testing:</strong> Many universities are now test-optional.</li>
          <li><strong>Essays:</strong> Personal statements reveal who the student is beyond grades.</li>
          <li><strong>Extracurriculars:</strong> Depth in a few areas stands out more than many short-term activities.</li>
          <li><strong>Recommendation letters:</strong> Teachers provide context about character and work ethic.</li>
        </ul>
        <p className="mt-3 text-base text-muted-foreground">Decisions fall into: <strong>Accepted</strong>, <strong>Waitlisted</strong>, <strong>Deferred</strong>, or <strong>Denied</strong>. Encouragement from parents makes the biggest difference.</p>
      </>
    ),
  },
  {
    id: "essay",
    title: "What Makes a Strong Essay",
    tag: "High impact",
    readTime: "5 min read",
    gradient: "from-pink-500 to-rose-600",
    emoji: "✍️",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">
          Strong essays don't try to impress — they reveal something genuine about how a student thinks and experiences the world.
        </p>
        <ul className="space-y-2 mt-3 text-base text-muted-foreground">
          <li><strong>Authenticity:</strong> Essays that feel overly polished are easy to spot.</li>
          <li><strong>Specific detail:</strong> Real moments say far more than broad statements about ambition.</li>
          <li><strong>Reflection:</strong> Self-awareness is often more powerful than the story itself.</li>
          <li><strong>Voice:</strong> Natural and clear writing, not overly formal.</li>
          <li><strong>Focus:</strong> One idea explored deeply beats many ideas covered shallowly.</li>
        </ul>
        <p className="mt-3 text-base text-muted-foreground">Parents support students best by encouraging independence in the writing process.</p>
      </>
    ),
  },
  {
    id: "financial-aid",
    title: "Financial Aid Explained",
    tag: "Essential reading",
    readTime: "4 min read",
    gradient: "from-emerald-500 to-teal-600",
    emoji: "💰",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">Universities offer several types of financial support that can significantly reduce the cost of attendance.</p>
        <ul className="space-y-2 mt-3 text-base text-muted-foreground">
          <li><strong>Need-based aid:</strong> Submit the FAFSA and CSS Profile to qualify.</li>
          <li><strong>Merit scholarships:</strong> Awarded for academic achievement or talent — not tied to financial need.</li>
          <li><strong>Institutional grants:</strong> Often the largest source of aid — and don't need to be repaid.</li>
        </ul>
        <p className="mt-3 text-base text-muted-foreground">Key distinction: <strong>grants and scholarships</strong> are free money. <strong>Loans</strong> must be repaid. Financial aid deadlines often come earlier than application deadlines.</p>
      </>
    ),
  },
  {
    id: "early-decision",
    title: "Early Decision vs Regular Decision",
    tag: "Strategy guide",
    readTime: "5 min read",
    gradient: "from-amber-500 to-orange-600",
    emoji: "📅",
    content: (
      <>
        <p className="text-base text-muted-foreground leading-relaxed">Students have several timing options — each with different implications.</p>
        <ul className="space-y-2 mt-3 text-base text-muted-foreground">
          <li><strong>Early Decision (ED):</strong> Apply in November; if admitted, enrollment is <em>binding</em>. Only apply ED if it's clearly the first choice.</li>
          <li><strong>Early Action (EA):</strong> Apply early, get an early decision — but <em>not binding</em>.</li>
          <li><strong>Regular Decision (RD):</strong> Standard January deadlines. Allows comparison of multiple offers.</li>
        </ul>
        <p className="mt-3 text-base text-muted-foreground">A balanced plan with a range of schools and timelines reduces pressure.</p>
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
            <p className="text-sm text-muted-foreground italic">No activity this week yet.</p>
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
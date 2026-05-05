import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePrincipalSchool } from "@/hooks/usePrincipalSchool";
import { usePrincipalStats } from "@/hooks/usePrincipalStats";
import { usePrincipalAnalytics } from "@/hooks/usePrincipalAnalytics";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Users, FileText, BookOpen, Award, Building2, Loader2,
  ShieldAlert, Clock, AlertTriangle, Trophy, Medal, Target,
  Lightbulb, PartyPopper, Settings, TrendingUp, Star,
} from "lucide-react";

// ── Stat card ────────────────────────────────────────────────
const StatCard = ({
  title, value, icon: Icon, iconBg, iconColor, accentBorder,
}: {
  title: string; value: number | string | undefined;
  icon: React.ElementType; iconBg: string; iconColor: string; accentBorder?: string;
}) => (
  <Card className={accentBorder ? `border-l-4 ${accentBorder}` : ""}>
    <CardContent className="p-5">
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconBg} rounded-xl shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {value === undefined ? (
            <Skeleton className="h-8 w-12 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ── Rank decoration ────────────────────────────��─────────────
const RANK_META = [
  { gradient: "from-yellow-400 via-amber-400 to-orange-400", label: "🥇", ring: "ring-yellow-400" },
  { gradient: "from-slate-300 via-slate-400 to-zinc-500",    label: "🥈", ring: "ring-slate-400"  },
  { gradient: "from-amber-600 via-amber-700 to-amber-800",   label: "🥉", ring: "ring-amber-600"  },
];

const LeaderCard = ({
  rank, name, avatarUrl, score, scoreLabel, sub,
}: {
  rank: number; name: string; avatarUrl: string | null;
  score: number; scoreLabel: string; sub?: string;
}) => {
  const meta = RANK_META[rank];
  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${meta.gradient} p-[2px]`}>
      <div className="rounded-2xl bg-card p-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className={`h-12 w-12 ring-2 ${meta.ring}`}>
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-sm font-bold">
              {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -top-1 -right-1 text-base leading-none">{meta.label}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{name}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          <div className="mt-1.5 flex items-center gap-2">
            <Progress
              value={score}
              className={`h-1.5 flex-1 ${rank === 0 ? "[&>div]:bg-amber-500" : rank === 1 ? "[&>div]:bg-slate-400" : "[&>div]:bg-amber-700"}`}
            />
            <span className="text-xs font-bold text-foreground shrink-0">{score}%</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-black text-foreground">{score}%</p>
          <p className="text-xs text-muted-foreground">{scoreLabel}</p>
        </div>
      </div>
    </div>
  );
};

// ── Rank list row (positions 4–10) ───────────────────────────
const RankListRow = ({
  rank, name, avatarUrl, score, scoreLabel, sub,
}: {
  rank: number; name: string; avatarUrl: string | null;
  score: number; scoreLabel: string; sub?: string;
}) => (
  <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted/30 transition-colors">
    <span className="w-7 text-center text-sm font-bold text-muted-foreground shrink-0">#{rank + 1}</span>
    <Avatar className="h-8 w-8 shrink-0">
      <AvatarImage src={avatarUrl ?? undefined} />
      <AvatarFallback className="text-xs font-semibold">
        {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{name}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
    <div className="shrink-0 text-right">
      <p className="text-sm font-bold text-foreground">{score}%</p>
      <p className="text-[10px] text-muted-foreground">{scoreLabel}</p>
    </div>
  </div>
);

// ── Custom pie label ─────────────────────────────────────────
const renderPieLabel = ({ name, percent }: { name: string; percent: number }) =>
  percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : "";

// ── Main component ───────────────────────────────────────────
const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const { data: school, isLoading: loadingSchool } = usePrincipalSchool();
  const { data: stats, isLoading: loadingStats } = usePrincipalStats();
  const { data: analytics, isLoading: loadingAnalytics } = usePrincipalAnalytics();

  const v = (n: number | undefined) => (loadingStats ? undefined : n);

  if (loadingSchool) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{school?.schoolName ?? "School Overview"}</h1>
          <p className="text-muted-foreground mt-1">Admin dashboard — school-wide performance snapshot</p>
        </div>
        {!loadingAnalytics && analytics && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2">
            <Target className="h-5 w-5 text-primary" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">School avg completion</p>
              <p className="text-xl font-black text-primary">{analytics.avgSchoolCompletion}%</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Totals row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Students"     value={v(stats?.totalStudents)}     icon={Users}     iconBg="bg-primary/10"       iconColor="text-primary" />
        <StatCard title="Counselors"   value={v(stats?.totalCounselors)}   icon={Building2} iconBg="bg-blue-500/10"      iconColor="text-blue-600" />
        <StatCard title="Essays"       value={v(stats?.totalEssays)}       icon={FileText}  iconBg="bg-yellow-500/10"    iconColor="text-yellow-600" />
        <StatCard title="Applications" value={v(stats?.totalApplications)} icon={BookOpen}  iconBg="bg-green-500/10"     iconColor="text-green-600" />
        <StatCard title="Rec Letters"  value={v(stats?.totalRecLetters)}   icon={Award}     iconBg="bg-purple-500/10"    iconColor="text-purple-600" />
      </div>

      {/* ── Alerts row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="At-Risk Students"    value={v(stats?.atRiskCount)}        icon={ShieldAlert}   iconBg="bg-destructive/10"  iconColor="text-destructive"  accentBorder="border-destructive" />
        <StatCard title="Essays Pending Review" value={v(stats?.essaysPending)}    icon={Clock}         iconBg="bg-amber-500/10"    iconColor="text-amber-600"    accentBorder="border-amber-500" />
        <StatCard title="Urgent Applications" value={v(stats?.urgentApplications)} icon={AlertTriangle} iconBg="bg-orange-500/10"   iconColor="text-orange-600"   accentBorder="border-orange-500" />
      </div>

      {/* ── Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Students */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Students
              <span className="text-sm font-normal text-muted-foreground ml-1">by completion %</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingAnalytics ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : !analytics?.topStudents.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No student data yet.</p>
            ) : (
              <>
                {analytics.topStudents.slice(0, 3).map((s, i) => (
                  <LeaderCard
                    key={s.id}
                    rank={i}
                    name={s.name}
                    avatarUrl={s.avatarUrl}
                    score={s.completionScore}
                    scoreLabel="completion"
                    sub={s.riskLevel === "at-risk" ? "⚠️ At Risk" : s.riskLevel === "needs-attention" ? "👀 Needs Attention" : "✅ On Track"}
                  />
                ))}
                {analytics.topStudents.length > 3 && (
                  <div className="mt-1 pt-2 border-t border-border space-y-0.5">
                    {analytics.topStudents.slice(3).map((s, i) => (
                      <RankListRow
                        key={s.id}
                        rank={i + 3}
                        name={s.name}
                        avatarUrl={s.avatarUrl}
                        score={s.completionScore}
                        scoreLabel="completion"
                        sub={s.riskLevel === "at-risk" ? "⚠️ At Risk" : s.riskLevel === "needs-attention" ? "👀 Needs Attention" : "✅ On Track"}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Counselors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              Top Counselors
              <span className="text-sm font-normal text-muted-foreground ml-1">by avg student completion</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingAnalytics ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : !analytics?.topCounselors.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No counselor data yet.</p>
            ) : (
              <>
                {analytics.topCounselors.slice(0, 3).map((c, i) => (
                  <LeaderCard
                    key={c.id}
                    rank={i}
                    name={c.name}
                    avatarUrl={c.avatarUrl}
                    score={c.avgCompletion}
                    scoreLabel="avg completion"
                    sub={`${c.studentCount} student${c.studentCount !== 1 ? "s" : ""}${c.atRiskCount > 0 ? ` · ${c.atRiskCount} at risk` : ""}`}
                  />
                ))}
                {analytics.topCounselors.length > 3 && (
                  <div className="mt-1 pt-2 border-t border-border space-y-0.5">
                    {analytics.topCounselors.slice(3).map((c, i) => (
                      <RankListRow
                        key={c.id}
                        rank={i + 3}
                        name={c.name}
                        avatarUrl={c.avatarUrl}
                        score={c.avgCompletion}
                        scoreLabel="avg completion"
                        sub={`${c.studentCount} student${c.studentCount !== 1 ? "s" : ""}${c.atRiskCount > 0 ? ` · ${c.atRiskCount} at risk` : ""}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Key Insights ── */}
      {!loadingAnalytics && analytics?.insights.length ? (
        <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-primary" />
              School Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {analytics.insights.map((insight, i) => {
                const colors = ["border-l-primary","border-l-amber-500","border-l-blue-500","border-l-purple-500"];
                return (
                  <div key={i} className={`p-3 bg-background/70 rounded-lg border border-l-4 ${colors[i % colors.length]}`}>
                    <p className="text-sm leading-snug">{insight}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Charts row 1: Essay trend + Risk distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Essay Activity — Last 6 Weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-64 w-full" /> :
             !analytics?.submissionTrend.some(d => d.submissions > 0) ? (
              <p className="text-sm text-muted-foreground text-center py-20">No essays submitted yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics!.submissionTrend}>
                  <defs>
                    <linearGradient id="essayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={2} fill="url(#essayGrad)" name="Essays" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Student Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-64 w-full" /> :
             !analytics?.riskDistribution.length ? (
              <p className="text-sm text-muted-foreground text-center py-20">No students enrolled yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics!.riskDistribution}
                    cx="50%" cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {analytics!.riskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v} students`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2: Student completion buckets + App status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Student Completion Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-64 w-full" /> :
             !analytics?.completionBuckets.some(b => b.count > 0) ? (
              <p className="text-sm text-muted-foreground text-center py-20">No students enrolled yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics!.completionBuckets} barSize={44}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v} students`, "Count"]} />
                  <Bar dataKey="count" name="Students" radius={[4,4,0,0]}>
                    {analytics!.completionBuckets.map((b, i) => (
                      <Cell key={i} fill={b.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-600" />
              Application Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-64 w-full" /> :
             !analytics?.appStatusDistribution.length ? (
              <p className="text-sm text-muted-foreground text-center py-20">No applications yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics!.appStatusDistribution}
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {analytics!.appStatusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v}`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 3: Deadlines by week + Counselor performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Upcoming Deadlines — Next 6 Weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-64 w-full" /> :
             !analytics?.deadlinesByWeek.some(d => d.count > 0) ? (
              <p className="text-sm text-muted-foreground text-center py-20">No upcoming deadlines.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics!.deadlinesByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count"  fill="#3b82f6" name="Total Deadlines" radius={[3,3,0,0]} />
                  <Bar dataKey="urgent" fill="#ef4444" name="Urgent (≤3 days)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="h-4 w-4 text-purple-600" />
              Counselor Performance
              <span className="text-xs font-normal text-muted-foreground">(avg student completion)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-64 w-full" /> :
             !analytics?.counselorPerf.length ? (
              <p className="text-sm text-muted-foreground text-center py-20">No counselor data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics!.counselorPerf} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Avg completion"]} />
                  <Bar dataKey="avgCompletion" radius={[0,4,4,0]} name="Avg Completion">
                    {analytics!.counselorPerf.map((c, i) => (
                      <Cell key={i} fill={c.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Popular target schools ── */}
      {!loadingAnalytics && analytics?.schoolDistribution.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Most Popular Target Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics!.schoolDistribution} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="school" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} applications`, "Count"]} />
                <Bar dataKey="applications" radius={[0,4,4,0]} name="Applications">
                  {analytics!.schoolDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Counselor roster badges ── */}
      {!loadingAnalytics && analytics?.counselorPerf.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Counselor Performance Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.counselorPerf.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderLeftColor: c.fill, borderLeftWidth: 4 }}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs font-bold">
                      {c.fullName.split(" ").map(n => n[0]).join("").slice(0,2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.fullName}</p>
                    <p className="text-xs text-muted-foreground">{c.studentCount} students</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={c.avgCompletion} className="h-1.5 flex-1" style={{ "--progress-fill": c.fill } as React.CSSProperties} />
                      <span className="text-xs font-semibold">{c.avgCompletion}%</span>
                    </div>
                  </div>
                  {c.atRiskCount > 0 && (
                    <Badge variant="destructive" className="text-xs shrink-0">{c.atRiskCount} risk</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Quick Actions ── */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/principal-students")}>
            <Users className="h-6 w-6" />
            Student Roster
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/principal-counselors")}>
            <Building2 className="h-6 w-6" />
            Counselors
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/principal-activities")}>
            <PartyPopper className="h-6 w-6" />
            Activities
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/principal-settings")}>
            <Settings className="h-6 w-6" />
            School Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PrincipalDashboard;

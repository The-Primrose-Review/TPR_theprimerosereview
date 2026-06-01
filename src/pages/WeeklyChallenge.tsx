import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Clock,
  Flame,
  Crown,
  Medal,
  Loader2,
  Target,
  CheckCircle2,
  ArrowRight,
  Lock,
  ChevronUp,
  Users,
  School,
} from "lucide-react";

interface Challenge {
  id: string;
  week_number: number;
  title: string;
  theme: string;
  description: string;
  example_prompt: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface CriterionScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

interface LeaderboardEntry {
  id: string;
  hook_text: string;
  ai_scores: { overallScore: number; criteria: CriterionScore[] } | null;
  submitted_at: string;
  student_id: string;
  name: string;
  initials: string;
}

const MAX_CHARS = 500;

function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function totalDays(startsAt: string, endsAt: string): number {
  return Math.ceil((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 86400000);
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const WeeklyChallenge = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [mySubmission, setMySubmission] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [participatingSchools, setParticipatingSchools] = useState(0);
  const [hookText, setHookText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  const loadLeaderboard = useCallback(async (challengeId: string, userId: string | null) => {
    const { data: subs } = await supabase
      .from("challenge_submissions")
      .select("id, hook_text, ai_scores, submitted_at, student_id")
      .eq("challenge_id", challengeId)
      .not("ai_scores", "is", null);

    if (!subs?.length) { setLeaderboard([]); return; }

    const ids = [...new Set(subs.map(s => s.student_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", ids);

    const profileMap: Record<string, string> = {};
    (profiles ?? []).forEach(p => { profileMap[p.user_id] = p.full_name ?? "Student"; });

    const ranked: LeaderboardEntry[] = (subs as any[])
      .filter(s => s.ai_scores?.overallScore != null)
      .sort((a, b) => b.ai_scores.overallScore - a.ai_scores.overallScore)
      .map(s => {
        const fullName = profileMap[s.student_id] ?? "Student";
        const parts = fullName.trim().split(" ");
        const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
        return {
          ...s,
          name: s.student_id === userId ? `${display} (You)` : display,
          initials: parts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
        };
      });

    setLeaderboard(ranked);
  }, []);

  const loadPlatformStats = useCallback(async (challengeId: string) => {
    const { data: subs } = await supabase
      .from("challenge_submissions")
      .select("student_id")
      .eq("challenge_id", challengeId);

    if (!subs?.length) { setSubmissionCount(0); setParticipatingSchools(0); return; }

    setSubmissionCount(subs.length);

    const ids = [...new Set(subs.map(s => s.student_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("school_id")
      .in("user_id", ids);

    const schools = new Set((profiles ?? []).map(p => p.school_id).filter(Boolean));
    setParticipatingSchools(schools.size);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id ?? null;
        setCurrentUserId(uid);

        const { data: challenges } = await supabase
          .from("weekly_challenges")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        const active = challenges?.[0] ?? null;
        setChallenge(active);

        if (!active) { setLoading(false); return; }

        const closed = new Date(active.ends_at) <= new Date();
        setIsClosed(closed);
        setCountdown(formatCountdown(active.ends_at));

        if (uid) {
          const { data: existing } = await supabase
            .from("challenge_submissions")
            .select("id, hook_text, ai_scores")
            .eq("challenge_id", active.id)
            .eq("student_id", uid)
            .maybeSingle();

          if (existing) {
            setMySubmission(existing);
            setHookText(existing.hook_text);
          }
        }

        await loadPlatformStats(active.id);
        if (closed) await loadLeaderboard(active.id, uid);
      } catch (e: any) {
        toast({ title: "Failed to load challenge", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadLeaderboard, loadPlatformStats, toast]);

  useEffect(() => {
    if (!challenge) return;
    const interval = setInterval(() => {
      const closed = new Date(challenge.ends_at) <= new Date();
      setIsClosed(closed);
      setCountdown(closed ? "Closed" : formatCountdown(challenge.ends_at));
    }, 30000);
    return () => clearInterval(interval);
  }, [challenge]);

  const handleSubmit = async () => {
    if (!challenge || !hookText.trim() || hookText.length > MAX_CHARS) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("judge-hook-challenge", {
        body: { hookText: hookText.trim(), challengeId: challenge.id, challengeTheme: challenge.theme },
      });
      if (error) throw error;

      setMySubmission({ hook_text: hookText.trim(), ai_scores: null });
      await loadPlatformStats(challenge.id);
      toast({ title: "Your opening has been submitted!", description: "Results will be revealed when the challenge closes." });
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center space-y-4 pt-20">
        <Trophy className="h-16 w-16 text-muted-foreground mx-auto opacity-30" />
        <h2 className="text-3xl font-bold text-foreground">No Active Challenge</h2>
        <p className="text-muted-foreground">Check back soon. A new Primrose Challenge will be posted here.</p>
        <Button onClick={() => navigate("/student-dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const myRank = isClosed ? leaderboard.findIndex(e => e.student_id === currentUserId) + 1 : null;
  const winner = isClosed ? leaderboard[0] : null;
  const daysLeft = daysUntil(challenge.ends_at);
  const totalD = totalDays(challenge.starts_at, challenge.ends_at);
  const timeProgress = isClosed ? 100 : Math.max(0, Math.min(100, ((totalD - daysLeft) / totalD) * 100));
  const rankEmoji = (r: number) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">

      {/* Main challenge card */}
      <Card className="overflow-hidden border-violet-200/70">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-400" />
        <CardContent className="p-6">
          <div className="flex items-start gap-5">

            {/* Trophy badge with live pulse */}
            <div className="shrink-0 relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              {!isClosed && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isClosed ? (
                  <Badge variant="destructive">Closed</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5">
                    <Flame className="h-3 w-3" /> Live Challenge
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5" /> {countdown}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground leading-tight">{challenge.title}</h1>
              <p className="text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{challenge.description}</p>
            </div>
          </div>

          {/* Time progress bar */}
          {!isClosed && (
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Challenge progress</span>
                <span className="text-orange-600 font-bold">{daysLeft}d remaining until {formatDeadline(challenge.ends_at)}</span>
              </div>
              <Progress value={timeProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-violet-100 bg-violet-50/40">
          <CardContent className="p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div className="text-3xl font-bold text-violet-700">{submissionCount}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">Submissions</div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/40">
          <CardContent className="p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <School className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-amber-700">{participatingSchools}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">Schools</div>
          </CardContent>
        </Card>

        <Card className={isClosed ? "border-gray-100 bg-gray-50/40" : "border-orange-100 bg-orange-50/40"}>
          <CardContent className="p-5 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isClosed ? "bg-gray-100" : "bg-orange-100"}`}>
              <Clock className={`h-5 w-5 ${isClosed ? "text-gray-500" : "text-orange-600"}`} />
            </div>
            <div className={`text-3xl font-bold ${isClosed ? "text-gray-500" : "text-orange-700"}`}>
              {isClosed ? "Done" : `${daysLeft}d`}
            </div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
              {isClosed ? "Ended" : `Until ${formatDeadline(challenge.ends_at)}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prize */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
              <Trophy className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="font-bold text-amber-900 uppercase tracking-wide text-sm">Prize</h3>
          </div>
          <div className="space-y-2 text-sm text-amber-800 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span>3 hours of admissions consulting with our senior consultants</span>
            </div>
            <div className="pl-7 text-xs font-bold text-amber-600">OR</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span>A family strategy session with your parents</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hint */}
      {challenge.example_prompt && !isClosed && (
        <Card className="border-violet-100 bg-violet-50/40">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm">💡</span>
            </div>
            <div>
              <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-1">Challenge Hint</p>
              <p className="text-violet-800 font-semibold text-sm">{challenge.example_prompt}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winner banner */}
      {isClosed && winner && (
        <Card className="border-yellow-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-500" />
          <CardContent className="p-5 flex items-center gap-4">
            <div className="text-4xl shrink-0">🏆</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Challenge Winner</p>
              <p className="font-bold text-foreground text-xl mt-0.5">{winner.name}</p>
              <p className="text-sm text-muted-foreground italic mt-1 truncate">"{winner.hook_text}"</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-4xl font-bold text-amber-500">{winner.ai_scores?.overallScore}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission form */}
      {!mySubmission && !isClosed && (
        <Card className="border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="h-5 w-5 text-primary" />
              Submit Your Opening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Write your opening — 1 to 3 sentences that begin your essay on the theme:{" "}
              <span className="font-bold text-violet-700">"{challenge.theme}"</span>
            </p>
            <div className="space-y-1.5">
              <Textarea
                value={hookText}
                onChange={e => setHookText(e.target.value)}
                rows={5}
                className="resize-none text-base border-violet-100 focus:border-violet-400"
                maxLength={MAX_CHARS}
              />
              <div className="flex justify-end text-xs text-muted-foreground">
                <span className={hookText.length > MAX_CHARS * 0.9 ? "text-destructive font-bold" : ""}>
                  {hookText.length}/{MAX_CHARS}
                </span>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || hookText.trim().length < 10 || hookText.length > MAX_CHARS}
              className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow shadow-violet-200"
              size="lg"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                : <><ArrowRight className="h-5 w-5" /> Start the Challenge</>
              }
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Already submitted — open */}
      {mySubmission && !isClosed && (
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800 text-lg">Your opening is in!</h3>
                <p className="text-green-700 text-sm mt-0.5">Scores are locked until the challenge closes.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Lock className="h-3.5 w-3.5" />
                Results on {formatDate(challenge.ends_at)}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-green-200 bg-white/80">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Your submitted opening</p>
              <p className="text-base italic text-foreground font-medium">"{mySubmission.hook_text}"</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
              <Trophy className="h-4 w-4 text-violet-500 shrink-0" />
              <p className="text-sm font-medium text-violet-700">
                <span className="font-bold">{submissionCount} student{submissionCount !== 1 ? "s" : ""}</span> have entered the Primrose Challenge.
                Rankings will be revealed when the challenge closes.
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setMySubmission(null)}>
              Edit my opening
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Closed — no submission */}
      {!mySubmission && isClosed && (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <p className="font-bold text-xl text-muted-foreground">This challenge has closed.</p>
            <p className="text-muted-foreground text-sm">You did not submit an opening for this round. Stay tuned for the next Primrose Challenge!</p>
          </CardContent>
        </Card>
      )}

      {/* Closed — your result */}
      {mySubmission && isClosed && (
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-400" />
          <CardHeader>
            <CardTitle className="text-xl">Your Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {mySubmission.ai_scores && (
                <div className="rounded-2xl bg-violet-50 border border-violet-200 p-5 text-center">
                  <div className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-1">Your Score</div>
                  <div className="text-5xl font-bold text-violet-700">{mySubmission.ai_scores.overallScore}</div>
                  <div className="text-xs text-muted-foreground mt-1">out of 100</div>
                </div>
              )}
              {myRank && myRank > 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center">
                  <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Your Rank</div>
                  <div className="text-5xl font-bold text-amber-600">{rankEmoji(myRank)}</div>
                  <div className="text-xs text-muted-foreground mt-1">of {leaderboard.length} entries</div>
                </div>
              )}
            </div>

            {mySubmission.ai_scores?.feedback && (
              <p className="text-muted-foreground leading-relaxed text-sm">{mySubmission.ai_scores.feedback}</p>
            )}

            {mySubmission.ai_scores?.criteria && (
              <div className="space-y-3">
                {mySubmission.ai_scores.criteria.map((c: CriterionScore) => (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-semibold">
                      <span style={{ color: c.color }}>{c.name}</span>
                      <span className="text-muted-foreground">{c.score}/100</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.score}%`, backgroundColor: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mySubmission.ai_scores?.strengths?.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-green-50 border border-green-100 p-4 space-y-2">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Strengths</p>
                  {mySubmission.ai_scores.strengths.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-green-800 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />{s}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 space-y-2">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">To Improve</p>
                  {mySubmission.ai_scores.improvements?.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-orange-800 font-medium">
                      <ChevronUp className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />{s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl border bg-muted/20">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Your opening</p>
              <p className="text-sm italic font-medium">"{mySubmission.hook_text}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final leaderboard */}
      {isClosed && leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-amber-500" />
              Final Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const isMe = entry.student_id === currentUserId;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={entry.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isMe ? "border-violet-300 bg-violet-50"
                      : rank === 1 ? "border-yellow-200 bg-yellow-50/60"
                      : rank === 2 ? "border-slate-200 bg-slate-50/60"
                      : rank === 3 ? "border-orange-200 bg-orange-50/40"
                      : "border-border hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center shrink-0">{rankEmoji(rank)}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-bold">{entry.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isTop3 ? "text-foreground" : "text-muted-foreground"}`}>{entry.name}</p>
                      <p className="text-xs text-muted-foreground truncate italic">"{entry.hook_text}"</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-lg font-bold ${rank === 1 ? "text-amber-500" : "text-primary"}`}>
                        {entry.ai_scores?.overallScore}
                      </span>
                    </div>
                  </div>
                  {entry.ai_scores?.criteria && isTop3 && (
                    <div className="flex gap-1 mt-2 pl-11">
                      {entry.ai_scores.criteria.map((c: CriterionScore) => (
                        <div
                          key={c.id}
                          title={`${c.name}: ${c.score}`}
                          className="h-1.5 flex-1 rounded-full"
                          style={{ backgroundColor: c.color, opacity: 0.7 + (c.score / 333) }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default WeeklyChallenge;

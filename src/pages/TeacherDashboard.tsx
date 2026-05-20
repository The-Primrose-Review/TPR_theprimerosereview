import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useTeacherEssays } from "@/hooks/useTeacherEssays";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Star,
  Loader2,
} from "lucide-react";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const { data: essays = [], isLoading } = useTeacherEssays();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.full_name) setTeacherName(data.full_name);
    };
    fetchProfile();
  }, []);

  const stats = {
    total: essays.length,
    pending: essays.filter((e) => e.teacherStatus === "pending").length,
    reviewed: essays.filter((e) => e.teacherStatus === "reviewed").length,
    avgScore: essays.filter((e) => e.aiScore).length
      ? Math.round(
          essays.filter((e) => e.aiScore).reduce((s, e) => s + (e.aiScore ?? 0), 0) /
            essays.filter((e) => e.aiScore).length
        )
      : null,
  };

  const recentEssays = essays.slice(0, 5);

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative">
          <p className="text-purple-200 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="text-3xl font-bold mb-2">{teacherName || "Teacher"}</h1>
          <p className="text-purple-100 text-sm">
            {stats.pending > 0
              ? `You have ${stats.pending} essay${stats.pending > 1 ? "s" : ""} waiting for your review.`
              : "All caught up! No essays pending review."}
          </p>
          <Button
            className="mt-4 bg-white text-purple-700 hover:bg-purple-50 font-semibold"
            onClick={() => navigate("/teacher-essays")}
          >
            View Essays
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Essays",
            value: isLoading ? "—" : stats.total,
            icon: FileText,
            gradient: "from-blue-500 to-cyan-500",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            label: "Pending Review",
            value: isLoading ? "—" : stats.pending,
            icon: Clock,
            gradient: "from-amber-500 to-orange-500",
            bg: "bg-amber-50 dark:bg-amber-950/30",
          },
          {
            label: "Reviewed",
            value: isLoading ? "—" : stats.reviewed,
            icon: CheckCircle,
            gradient: "from-emerald-500 to-teal-500",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
          },
          {
            label: "Avg AI Score",
            value: isLoading ? "—" : stats.avgScore ?? "—",
            icon: Star,
            gradient: "from-pink-500 to-rose-500",
            bg: "bg-pink-50 dark:bg-pink-950/30",
          },
        ].map(({ label, value, icon: Icon, gradient, bg }) => (
          <Card key={label} className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <div className={`h-5 w-5 bg-gradient-to-br ${gradient} rounded-md flex items-center justify-center`}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent essays */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            Recent Essays
          </h2>
          {essays.length > 5 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/teacher-essays")}>
              View all
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && recentEssays.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No essays yet</p>
              <p className="text-xs text-muted-foreground">
                Students will appear here once they share an essay with you.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && recentEssays.map((essay) => (
          <Card
            key={essay.shareId}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate("/teacher-essays")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-600 text-white text-xs font-semibold">
                    {essay.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-purple-600 transition-colors">
                    {essay.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{essay.studentName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {essay.aiScore && (
                    <Badge variant="outline" className="text-xs hidden sm:flex">
                      <Star className="h-3 w-3 mr-1 text-amber-500" />
                      {essay.aiScore}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      essay.teacherStatus === "pending"
                        ? "border-amber-300 text-amber-600 bg-amber-50"
                        : essay.teacherStatus === "reviewed"
                        ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                        : "border-border"
                    }`}
                  >
                    {essay.teacherStatus === "pending" ? (
                      <><AlertCircle className="h-3 w-3 mr-1" />Pending</>
                    ) : (
                      <><CheckCircle className="h-3 w-3 mr-1" />Reviewed</>
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherDashboard;

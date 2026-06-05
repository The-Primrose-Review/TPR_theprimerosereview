import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const getIconBgColor = (color: string) => {
  switch (color) {
    case "primary":     return "bg-gradient-primary";
    case "secondary":   return "bg-gradient-secondary";
    case "warning":     return "bg-warning";
    case "destructive": return "bg-destructive";
    default:            return "bg-primary";
  }
};

const getChangeColor = (type: string) => {
  switch (type) {
    case "positive": return "text-success";
    case "negative": return "text-destructive";
    default:         return "text-muted-foreground";
  }
};

export const DashboardStats = () => {
  const { data, isLoading } = useDashboardStats();

   console.log("isLoading:", isLoading);
  console.log("data:", data);

  const stats = [
    {
      title: "Total Students",
      value: data?.totalStudents ?? 0,
      change: "assigned to you",
      changeType: "neutral" as const,
      icon: Users,
      color: "primary",
    },
    {
      title: "Essays in Review",
      value: data?.essaysInReview ?? 0,
      change: "need attention",
      changeType: "positive" as const,
      icon: FileText,
      color: "secondary",
    },
    {
      title: "Upcoming Deadlines",
      value: data?.upcomingDeadlines ?? 0,
      change: "next 14 days",
      changeType: "neutral" as const,
      icon: Calendar,
      color: "warning",
    },
    {
      title: "At Risk Students",
      value: data?.atRiskStudents ?? 0,
      change: data?.atRiskStudents === 0 ? "all on track" : "need follow-up",
      changeType: (data?.atRiskStudents ?? 0) === 0
        ? ("positive" as const)
        : ("negative" as const),
      icon: AlertTriangle,
      color: "destructive",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="p-6 hover:shadow-card-hover transition-all duration-300 animate-fade-in group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stat.value}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getChangeColor(stat.changeType)}`}
                  >
                    {stat.change}
                  </Badge>
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${getIconBgColor(stat.color)} group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};


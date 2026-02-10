import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FolderKanban,
  CheckSquare,
  CreditCard,
  AlertTriangle,
  Clock,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { MasterMetrics } from "@/components/dashboard/master-metrics";
import { RealTimeROI } from "@/components/dashboard/real-time-roi";
import { SystemHeartbeat } from "@/components/dashboard/system-heartbeat";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { AutomationBlueprint } from "@/components/dashboard/automation-blueprint";
import { MetricsCharts } from "@/components/dashboard/metrics-charts";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50";
    case "medium":
      return "text-yellow-600 bg-yellow-50";
    case "low":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getNoteTypeIcon = (type: string) => {
  switch (type) {
    case "call":
      return <CheckSquare className="h-4 w-4" />;
    case "meeting":
      return <Users className="h-4 w-4" />;
    case "email":
      return <FolderKanban className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  let clientCount = 0;
  let activeProjectCount = 0;
  let pendingTaskCount = 0;
  let overdueTasks: any[] = [];
  let todayTasks: any[] = [];
  let atRiskProjects: any[] = [];
  let recentNotes: any[] = [];

  try {
    const results = await Promise.all([
      prisma.client.count({ where: { status: "active" } }),
      prisma.project.count({
        where: { status: { in: ["in_progress", "planning", "review"] } },
      }),
      prisma.task.count({
        where: { status: { in: ["todo", "in_progress"] } },
      }),
      prisma.task.findMany({
        where: {
          dueDate: { lt: todayStart },
          status: { not: "completed" },
        },
        include: {
          client: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          dueDate: { gte: todayStart, lt: todayEnd },
          status: { not: "completed" },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.project.findMany({
        where: { status: "at_risk" },
        include: { client: { select: { name: true } } },
        take: 5,
      }),
      prisma.note.findMany({
        include: {
          creator: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    clientCount = results[0];
    activeProjectCount = results[1];
    pendingTaskCount = results[2];
    overdueTasks = results[3];
    todayTasks = results[4];
    atRiskProjects = results[5];
    recentNotes = results[6];
  } catch (error) {
    console.error("Dashboard data fetch error (Safe Mode enabled):", error);
    // Fallback to empty data or mock data as already initialized above
  }


  const stats = [
    {
      title: "Total Clients",
      value: clientCount.toString(),
      icon: Users,
    },
    {
      title: "Active Projects",
      value: activeProjectCount.toString(),
      icon: FolderKanban,
    },
    {
      title: "Tasks Pending",
      value: pendingTaskCount.toString(),
      icon: CheckSquare,
    },
    {
      title: "Overdue Tasks",
      value: overdueTasks.length.toString(),
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to SimplyOps - your operations command center.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-Time ROI Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-gradient">Master Metrics & ROI</h2>
        <MasterMetrics />
        <RealTimeROI hoursSaved={42} moneySaved={840} multiple={3.2} />
      </div>

      {/* Growth Analytics Charts */}
      <MetricsCharts />

      {/* System Health & Onboarding */}
      <div className="grid gap-4 md:grid-cols-2">
        <SystemHeartbeat />
        <OnboardingChecklist />
      </div>

      {/* Automation Blueprint */}
      <AutomationBlueprint />

      {/* Today's Focus & Overdue */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Today&apos;s Tasks
            </CardTitle>
            <CardDescription>Tasks scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tasks due today.
              </p>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Overdue Tasks
            </CardTitle>
            <CardDescription>
              Tasks that need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No overdue tasks. Nice work!
              </p>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((task) => {
                  const daysOverdue = Math.floor(
                    (now.getTime() - (task.dueDate?.getTime() ?? now.getTime())) /
                    (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 dark:border-red-900 dark:bg-red-950/60"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-300">
                          {task.title}
                        </p>
                        {task.client && (
                          <p className="text-sm text-red-700 dark:text-red-400">
                            {task.client.name}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive">
                        {daysOverdue} days overdue
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Projects & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              At-Risk Projects
            </CardTitle>
            <CardDescription>Projects requiring intervention</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No at-risk projects.
              </p>
            ) : (
              <div className="space-y-3">
                {atRiskProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 dark:border-orange-900 dark:bg-orange-950/60"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-orange-900 dark:text-orange-300">
                        {project.name}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-400">
                        {project.client.name}
                      </p>
                    </div>
                    {project.dueDate && (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-200"
                      >
                        Due{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                        }).format(project.dueDate)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest notes and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent activity.
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start space-x-3 p-2"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      {getNoteTypeIcon(note.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {note.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {note.creator.name ?? "Unknown"} •{" "}
                        {timeAgo(note.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you can perform quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/clients">
                <Users className="mr-2 h-4 w-4" />
                Clients
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/projects">
                <FolderKanban className="mr-2 h-4 w-4" />
                Projects
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/tasks">
                <CheckSquare className="mr-2 h-4 w-4" />
                Tasks
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/finance">
                <CreditCard className="mr-2 h-4 w-4" />
                Finance
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

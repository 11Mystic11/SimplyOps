import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  User,
  FolderKanban,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

async function getActivities() {
  return prisma.note.findMany({
    include: {
      creator: { select: { name: true } },
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

type Activity = Awaited<ReturnType<typeof getActivities>>[number];

const typeConfig: Record<string, { icon: typeof Phone; label: string; color: string }> = {
  call: { icon: Phone, label: "Call", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  email: { icon: Mail, label: "Email", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  meeting: { icon: Calendar, label: "Meeting", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  general: { icon: FileText, label: "Note", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function ActivityCard({ activity }: { activity: Activity }) {
  const config = typeConfig[activity.type] || typeConfig.general;
  const Icon = config.icon;

  return (
    <div className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`flex-shrink-0 p-2 rounded-lg ${config.color}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(activity.createdAt)}
          </span>
        </div>

        <p className="text-sm mb-2 line-clamp-3">{activity.content}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {activity.creator?.name && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{activity.creator.name}</span>
            </div>
          )}

          {activity.client && (
            <Link
              href={`/clients/${activity.client.id}`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <User className="h-3 w-3" />
              <span>{activity.client.name}</span>
            </Link>
          )}

          {activity.project && (
            <Link
              href={`/projects/${activity.project.id}`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <FolderKanban className="h-3 w-3" />
              <span>{activity.project.name}</span>
            </Link>
          )}

          {activity.task && (
            <Link
              href={`/tasks/${activity.task.id}`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <CheckSquare className="h-3 w-3" />
              <span>{activity.task.title}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ActivityPage() {
  const activities = await getActivities();

  const callCount = activities.filter((a) => a.type === "call").length;
  const emailCount = activities.filter((a) => a.type === "email").length;
  const meetingCount = activities.filter((a) => a.type === "meeting").length;
  const noteCount = activities.filter((a) => a.type === "general").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">
          Recent calls, emails, meetings, and notes across all clients and projects.
        </p>
      </div>

      {/* Activity Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callCount}</div>
            <p className="text-xs text-muted-foreground">Phone calls logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails</CardTitle>
            <Mail className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailCount}</div>
            <p className="text-xs text-muted-foreground">Email threads tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingCount}</div>
            <p className="text-xs text-muted-foreground">Meetings recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{noteCount}</div>
            <p className="text-xs text-muted-foreground">General notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            All interactions and notes from the past few weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-4" />
              <p className="text-sm">
                No activity yet. Log your first call, email, or meeting to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

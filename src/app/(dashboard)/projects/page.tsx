import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import NewProjectDialog from "@/components/forms/new-project-dialog";
import { prisma } from "@/lib/db";

async function getProjects() {
  return prisma.project.findMany({
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
      tasks: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "planning":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "review":
      return "bg-purple-100 text-purple-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "on_hold":
      return "bg-gray-100 text-gray-800";
    case "at_risk":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getProjectTypeColor = (type: string) => {
  switch (type) {
    case "Website Build":
      return "bg-blue-50 text-blue-700";
    case "Automation Build":
      return "bg-green-50 text-green-700";
    case "Custom":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};

const formatDate = (date: Date | null) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Track and manage your project delivery pipeline.
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-4" />
            <p className="text-sm">
              No projects yet. Create your first project to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          {projects.map((project) => {
            const tasksCompleted = project.tasks.filter(
              (t) => t.status === "completed" || t.status === "done",
            ).length;
            const tasksTotal = project._count.tasks;
            const progress =
              tasksTotal > 0
                ? Math.round((tasksCompleted / tasksTotal) * 100)
                : 0;
            return (
              <Card
                key={project.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-1">
                        {project.status === "at_risk" && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {project.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getProjectTypeColor(project.type)}>
                          {project.type}
                        </Badge>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">
                        {project.client.name}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Timeline:</span>
                      <span className="font-medium">
                        {formatDate(project.startDate)} —{" "}
                        {formatDate(project.dueDate)}
                      </span>
                    </div>

                    {project.budget && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-medium">
                          ${project.budget.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {tasksCompleted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Completed
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {tasksTotal - tasksCompleted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Remaining
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Progress
                      </div>
                      <div className="text-lg font-bold">{progress}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

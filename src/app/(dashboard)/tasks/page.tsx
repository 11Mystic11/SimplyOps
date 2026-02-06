import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Calendar,
  FolderKanban,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import NewTaskDialog from "@/components/forms/new-task-dialog";
import TaskStatusToggle from "@/components/features/task-status-toggle";
import TaskActions from "@/components/features/task-actions";
import { prisma } from "@/lib/db";

async function getTasks() {
  return prisma.task.findMany({
    include: {
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: [
      { project: { name: "asc" } },
      { dueDate: "asc" },
    ],
  });
}

type TaskWithRelations = Awaited<ReturnType<typeof getTasks>>[number];

interface ProjectGroup {
  id: string | null;
  name: string;
  tasks: TaskWithRelations[];
}

function groupTasksByProject(tasks: TaskWithRelations[]): ProjectGroup[] {
  const groups = new Map<string | null, ProjectGroup>();

  for (const task of tasks) {
    const projectId = task.project?.id ?? null;
    const projectName = task.project?.name ?? "No Project";

    if (!groups.has(projectId)) {
      groups.set(projectId, {
        id: projectId,
        name: projectName,
        tasks: [],
      });
    }
    groups.get(projectId)!.tasks.push(task);
  }

  // Sort: projects with names first (alphabetically), "No Project" last
  const sorted = Array.from(groups.values()).sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.name.localeCompare(b.name);
  });

  return sorted;
}

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

const isOverdue = (dueDate: Date | null, status: string) => {
  if (!dueDate || status === "completed") return false;
  return dueDate < new Date();
};

const formatDate = (date: Date | null) => {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
};

export default async function TasksPage() {
  const tasks = await getTasks();

  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks, deadlines, and deliverables.
          </p>
        </div>
        <NewTaskDialog />
      </div>

      {/* Task Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              In Progress
            </CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inProgressTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Completed
            </CardTitle>
            <CheckSquare className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedTasks}
            </div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Grouped by Project */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
              <CheckSquare className="h-10 w-10 mb-4" />
              <p className="text-sm">
                No tasks yet. Create your first task to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupTasksByProject(tasks).map((group) => {
            const groupOverdue = group.tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
            const groupCompleted = group.tasks.filter((t) => t.status === "completed").length;

            return (
              <Card key={group.id ?? "no-project"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {group.id ? (
                        <FolderKanban className="h-5 w-5 text-primary" />
                      ) : (
                        <Inbox className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="secondary" className="ml-2">
                        {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {groupOverdue > 0 && (
                        <Badge variant="destructive">{groupOverdue} overdue</Badge>
                      )}
                      {groupCompleted > 0 && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          {groupCompleted} done
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    {group.id
                      ? `Tasks for ${group.name}`
                      : "Tasks not assigned to any project"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.tasks.map((task) => {
                      const overdue = isOverdue(task.dueDate, task.status);
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow ${
                            overdue ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/60" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                <TaskStatusToggle
                                  taskId={task.id}
                                  status={task.status}
                                />
                                {overdue && (
                                  <Badge variant="destructive">OVERDUE</Badge>
                                )}
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {task.client && (
                                <div className="flex items-center space-x-1">
                                  <span>{task.client.name}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span
                                  className={
                                    overdue ? "text-red-600 font-medium" : ""
                                  }
                                >
                                  Due: {formatDate(task.dueDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <TaskActions taskId={task.id} taskTitle={task.title} />
                        </div>
                      );
                    })}
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

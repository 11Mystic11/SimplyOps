"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const statusFlow: Record<string, string> = {
  todo: "in_progress",
  in_progress: "completed",
  completed: "todo",
  blocked: "todo",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "todo":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "blocked":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function TaskStatusToggle({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();

  const handleClick = async () => {
    const nextStatus = statusFlow[status] ?? "todo";
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  };

  return (
    <Badge
      className={`cursor-pointer ${getStatusColor(status)}`}
      onClick={handleClick}
    >
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
}

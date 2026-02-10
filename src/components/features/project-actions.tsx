"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import EditProjectDialog from "@/components/forms/edit-project-dialog";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  budget: number | null;
  startDate: string | null;
  dueDate: string | null;
  clientId: string;
}

export default function ProjectActions({ project }: { project: ProjectData }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setShowDelete(false);
      router.refresh();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-[5]"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => {
                  setShowMenu(false);
                  setShowEdit(true);
                }}
              >
                <Pencil className="h-3 w-3" />
                Edit Project
              </button>

              <div className="my-1 h-px bg-border" />

              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                onClick={() => {
                  setShowMenu(false);
                  setShowDelete(true);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Remove Project
              </button>
            </div>
          </>
        )}
      </div>

      <EditProjectDialog
        project={project}
        open={showEdit}
        onOpenChange={setShowEdit}
      />

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{project.name}&quot;? This
              action cannot be undone and will delete all associated tasks,
              notes, and expenses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

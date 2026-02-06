"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

const initialFormState = {
  name: "",
  description: "",
  type: "" as string,
  clientId: "",
  budget: "",
  startDate: "",
  dueDate: "",
};

export default function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => setClients(data))
        .catch(() => setClients([]));
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        clientId: formData.clientId,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
      };

      if (!payload.name) {
        setError("Project name is required");
        setIsSubmitting(false);
        return;
      }
      if (!payload.type) {
        setError("Project type is required");
        setIsSubmitting(false);
        return;
      }
      if (!payload.clientId) {
        setError("Client is required");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create project");
      }

      setFormData(initialFormState);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Create a new project. Select a client and fill in the details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                placeholder="Brief project description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Project Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website Build">Website Build</SelectItem>
                    <SelectItem value="Automation Build">
                      Automation Build
                    </SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, clientId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-budget">Budget ($)</Label>
              <Input
                id="project-budget"
                type="number"
                placeholder="0.00"
                value={formData.budget}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, budget: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project-start">Start Date</Label>
                <Input
                  id="project-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-due">Due Date</Label>
                <Input
                  id="project-due"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive px-1" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

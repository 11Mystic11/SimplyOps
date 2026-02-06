"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";

interface ClientData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
}

interface EditClientDialogProps {
  client: ClientData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditClientDialog({
  client,
  open,
  onOpenChange,
}: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    website: client.website ?? "",
    industry: client.industry ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const normalizeWebsite = (url: string) => {
    if (!url.trim()) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        website: normalizeWebsite(formData.website) || null,
        industry: formData.industry.trim() || null,
      };

      if (!payload.name) {
        setError("Client name is required");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update client");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update client",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Client Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter client name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="client@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                placeholder="+1-555-0123"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, website: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-industry">Industry</Label>
              <Input
                id="edit-industry"
                placeholder="Technology, Retail, etc."
                value={formData.industry}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    industry: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive px-1" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

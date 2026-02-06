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
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import EditClientDialog from "@/components/forms/edit-client-dialog";
import ScanResultsDialog from "@/components/features/scan-results-dialog";

interface ClientData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  status: string;
}

interface ScanResult {
  product: string;
  relevance: string;
  problem: string;
  pitch: string;
  estimated_value: string;
}

export default function ClientActions({ client }: { client: ClientData }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setShowDelete(false);
      router.refresh();
    } catch {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setShowMenu(false);
    await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  const handleScan = async () => {
    setShowMenu(false);
    setShowScan(true);
    setIsScanning(true);
    setScanResults(null);
    setScannedAt(null);

    try {
      const response = await fetch(`/api/clients/${client.id}/scan`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Scan failed");
      const data = await response.json();
      setScanResults(data.scan.results);
      setScannedAt(data.scan.createdAt);
    } catch {
      setScanResults([]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenScan = async () => {
    setShowMenu(false);
    setShowScan(true);
    setIsScanning(true);

    try {
      const response = await fetch(`/api/clients/${client.id}/scan`);
      if (!response.ok) throw new Error("Failed to fetch scan");
      const data = await response.json();

      if (data.scan) {
        setScanResults(data.scan.results);
        setScannedAt(data.scan.createdAt);
        setIsScanning(false);
      } else {
        await handleScan();
      }
    } catch {
      await handleScan();
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
                Edit
              </button>

              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-purple-600 hover:bg-accent"
                onClick={handleOpenScan}
              >
                <Sparkles className="h-3 w-3" />
                Scan for Opportunities
              </button>

              <div className="my-1 h-px bg-border" />

              {client.status !== "active" && (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-green-600 hover:bg-accent"
                  onClick={() => handleStatusChange("active")}
                >
                  <CheckCircle className="h-3 w-3" />
                  Mark Active
                </button>
              )}

              {client.status !== "at_risk" && (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-yellow-600 hover:bg-accent"
                  onClick={() => handleStatusChange("at_risk")}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Payment Declined
                </button>
              )}

              {client.status !== "churned" && (
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-orange-600 hover:bg-accent"
                  onClick={() => handleStatusChange("churned")}
                >
                  <XCircle className="h-3 w-3" />
                  Canceled Subscription
                </button>
              )}

              <div className="my-1 h-px bg-border" />

              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                onClick={() => {
                  setShowMenu(false);
                  setShowDelete(true);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Remove Client
              </button>
            </div>
          </>
        )}
      </div>

      <EditClientDialog
        client={client}
        open={showEdit}
        onOpenChange={setShowEdit}
      />

      <ScanResultsDialog
        open={showScan}
        onOpenChange={setShowScan}
        clientName={client.name}
        results={scanResults}
        scannedAt={scannedAt}
        onRescan={handleScan}
        isScanning={isScanning}
      />

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{client.name}&quot;? This
              action cannot be undone and will delete all associated projects,
              tasks, and notes.
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

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Rocket,
  Users,
  Mail,
  Linkedin,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
  Search,
  AlertTriangle,
} from "lucide-react";

interface Prospect {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  linkedinUrl: string | null;
  jobTitle: string | null;
  company: string | null;
  industry: string | null;
  companySize: string | null;
  persona: string | null;
  phone: string | null;
  personalizedLine: string | null;
  source: string | null;
  status: string;
  outreachChannel: string | null;
  campaignId: string | null;
  notes: string | null;
  importBatch: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  replied:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  booked:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  converted:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  unresponsive:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PERSONA_LABELS: Record<string, string> = {
  owner_operator: "Owner/Operator",
  ops_manager: "Ops Manager",
  sales_revops: "Sales/RevOps",
  admin_manager: "Admin Manager",
};

// CSV field mapping: maps common CSV headers to our schema
const FIELD_MAP: Record<string, string> = {
  first_name: "firstName",
  firstname: "firstName",
  "first name": "firstName",
  last_name: "lastName",
  lastname: "lastName",
  "last name": "lastName",
  email: "email",
  "email address": "email",
  linkedin: "linkedinUrl",
  linkedin_url: "linkedinUrl",
  "linkedin url": "linkedinUrl",
  job_title: "jobTitle",
  jobtitle: "jobTitle",
  "job title": "jobTitle",
  title: "jobTitle",
  company: "company",
  company_name: "company",
  "company name": "company",
  industry: "industry",
  company_size: "companySize",
  "company size": "companySize",
  companysize: "companySize",
  persona: "persona",
  phone: "phone",
  personalized_line: "personalizedLine",
  notes: "notes",
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      const mappedField = FIELD_MAP[header] || header;
      row[mappedField] = values[i]?.replace(/^"|"$/g, "") || "";
    });
    return row;
  });
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [personaFilter, setPersonaFilter] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [outreachResult, setOutreachResult] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProspects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (personaFilter) params.set("persona", personaFilter);
      const res = await fetch(`/api/prospects?${params}`);
      if (res.ok) setProspects(await res.json());
    } catch (err) {
      console.error("Error loading prospects:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, personaFilter]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  // ── CSV Import ───────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        alert("No valid rows found in CSV. Make sure it has headers and at least one data row.");
        return;
      }

      // Ensure every row has firstName
      const validRows = rows
        .map((row) => ({
          firstName: row.firstName || row.first_name || "Unknown",
          lastName: row.lastName || "",
          email: row.email || "",
          linkedinUrl: row.linkedinUrl || "",
          jobTitle: row.jobTitle || "",
          company: row.company || "",
          industry: row.industry || "",
          companySize: row.companySize || "",
          persona: row.persona || "",
          phone: row.phone || "",
          personalizedLine: row.personalizedLine || "",
          notes: row.notes || "",
        }))
        .filter((r) => r.firstName);

      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospects: validRows }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Imported ${data.imported} prospects successfully.`);
        loadProspects();
      } else {
        const err = await res.json();
        alert(`Import failed: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("CSV import error:", err);
      alert("Failed to parse CSV file.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Outreach Launch ──────────────────────────────────────────────────────

  const launchOutreach = async (channels: string[]) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      alert("Select at least one prospect to launch outreach.");
      return;
    }

    if (
      !confirm(
        `Launch ${channels.join(" + ")} outreach to ${ids.length} prospect(s)?`
      )
    )
      return;

    setIsLaunching(true);
    setOutreachResult(null);
    try {
      const res = await fetch("/api/prospects/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectIds: ids, channels }),
      });

      if (res.ok) {
        const data = await res.json();
        setOutreachResult(data.summary);
        setSelectedIds(new Set());
        loadProspects();
      } else {
        const err = await res.json();
        alert(`Outreach failed: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Outreach error:", err);
      alert("Failed to launch outreach.");
    } finally {
      setIsLaunching(false);
    }
  };

  // ── Delete Selected ──────────────────────────────────────────────────────

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} prospect(s)?`)) return;

    try {
      const res = await fetch(`/api/prospects?ids=${ids.join(",")}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedIds(new Set());
        loadProspects();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ── Selection ────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────

  const filtered = prospects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.company?.toLowerCase().includes(q) ||
      p.jobTitle?.toLowerCase().includes(q) ||
      p.industry?.toLowerCase().includes(q)
    );
  });

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: prospects.length,
    new: prospects.filter((p) => p.status === "new").length,
    contacted: prospects.filter((p) => p.status === "contacted").length,
    replied: prospects.filter((p) => p.status === "replied").length,
    booked: prospects.filter((p) => p.status === "booked").length,
  };

  const hasEmail = filtered.some(
    (p) => selectedIds.has(p.id) && p.email
  );
  const hasLinkedin = filtered.some(
    (p) => selectedIds.has(p.id) && p.linkedinUrl
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospects</h1>
          <p className="text-muted-foreground">
            Import leads, manage your pipeline, and launch outreach campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadProspects}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Prospects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.contacted}
            </div>
            <p className="text-xs text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.replied}
            </div>
            <p className="text-xs text-muted-foreground">Replied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.booked}
            </div>
            <p className="text-xs text-muted-foreground">Booked</p>
          </CardContent>
        </Card>
      </div>

      {/* Outreach Result Banner */}
      {outreachResult && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">
                Outreach Launched
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {(outreachResult as Record<string, number>).totalProspects} prospects enrolled
              {(outreachResult as Record<string, number>).emailEnrolled > 0 &&
                ` · ${(outreachResult as Record<string, number>).emailEnrolled} via email`}
              {(outreachResult as Record<string, number>).linkedinEnrolled > 0 &&
                ` · ${(outreachResult as Record<string, number>).linkedinEnrolled} via LinkedIn`}
              {(outreachResult as Record<string, number>).skipped > 0 &&
                ` · ${(outreachResult as Record<string, number>).skipped} skipped (missing contact info)`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters + Actions Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prospects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="booked">Booked</option>
                <option value="converted">Converted</option>
                <option value="unresponsive">Unresponsive</option>
              </select>
              <select
                value={personaFilter}
                onChange={(e) => setPersonaFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All personas</option>
                <option value="owner_operator">Owner/Operator</option>
                <option value="ops_manager">Ops Manager</option>
                <option value="sales_revops">Sales/RevOps</option>
                <option value="admin_manager">Admin Manager</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground self-center">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={() => launchOutreach(["email", "linkedin"])}
                    disabled={isLaunching || (!hasEmail && !hasLinkedin)}
                  >
                    <Rocket className="h-4 w-4 mr-1" />
                    {isLaunching ? "Launching..." : "Launch Outreach"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => launchOutreach(["email"])}
                    disabled={isLaunching || !hasEmail}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email Only
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => launchOutreach(["linkedin"])}
                    disabled={isLaunching || !hasLinkedin}
                  >
                    <Linkedin className="h-4 w-4 mr-1" />
                    LinkedIn Only
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteSelected}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prospects Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Prospect List ({filtered.length})
            </div>
          </CardTitle>
          <CardDescription>
            Import a CSV or add prospects manually. Select rows and hit Launch
            Outreach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No prospects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Import a CSV file to get started with your outreach pipeline.
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-2">
                      <button onClick={toggleSelectAll}>
                        {selectedIds.size === filtered.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium hidden md:table-cell">
                      Company
                    </th>
                    <th className="pb-3 font-medium hidden lg:table-cell">
                      Title
                    </th>
                    <th className="pb-3 font-medium hidden lg:table-cell">
                      Persona
                    </th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b last:border-0 hover:bg-accent/50 transition-colors ${
                        selectedIds.has(p.id) ? "bg-accent/30" : ""
                      }`}
                    >
                      <td className="py-3 pr-2">
                        <button onClick={() => toggleSelect(p.id)}>
                          {selectedIds.has(p.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="font-medium">
                          {p.firstName} {p.lastName || ""}
                        </div>
                        {p.industry && (
                          <div className="text-xs text-muted-foreground">
                            {p.industry}
                          </div>
                        )}
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        {p.company || "—"}
                      </td>
                      <td className="py-3 hidden lg:table-cell text-muted-foreground">
                        {p.jobTitle || "—"}
                      </td>
                      <td className="py-3 hidden lg:table-cell">
                        {p.persona ? (
                          <Badge variant="outline" className="text-xs">
                            {PERSONA_LABELS[p.persona] || p.persona}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {p.email && (
                            <span title={p.email}>
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </span>
                          )}
                          {p.linkedinUrl && (
                            <span title="LinkedIn">
                              <Linkedin className="h-4 w-4 text-muted-foreground" />
                            </span>
                          )}
                          {!p.email && !p.linkedinUrl && (
                            <span title="No contact info">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[p.status] || STATUS_COLORS.new
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Format Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Import Format</CardTitle>
          <CardDescription>
            Your CSV should have headers matching these column names (case-insensitive):
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="text-xs bg-muted p-3 rounded block overflow-x-auto">
            first_name, last_name, email, linkedin_url, job_title, company,
            industry, company_size, persona, phone, notes
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Only <strong>first_name</strong> is required. Common header
            variations (e.g. &quot;First Name&quot;, &quot;firstName&quot;, &quot;firstname&quot;) are
            auto-mapped.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

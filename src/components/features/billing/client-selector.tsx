"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertCircle } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  billingEmail: string | null;
  stripeCustomerId: string | null;
  status: string;
}

interface ClientSelectorProps {
  selectedClientId: string | null;
  onSelect: (client: Client | null) => void;
}

export default function ClientSelector({
  selectedClientId,
  onSelect,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.status === "active" &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = clients.find((c) => c.id === selectedClientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-search">Search clients</Label>
          <Input
            id="client-search"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading clients...</p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() =>
                  onSelect(client.id === selectedClientId ? null : client)
                }
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  client.id === selectedClientId
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.billingEmail || client.email || "No email"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.stripeCustomerId ? (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Stripe
                      </Badge>
                    ) : null}
                    {client.id === selectedClientId && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matching clients found
              </p>
            )}
          </div>
        )}

        {selected && !(selected.billingEmail || selected.email) && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              This client has no email address. Add one before sending invoices.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

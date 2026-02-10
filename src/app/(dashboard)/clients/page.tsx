import { Prisma } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Globe, Users } from "lucide-react";
import NewClientDialog from "@/components/forms/new-client-dialog";
import ClientActions from "@/components/features/client-actions";
import { prisma } from "@/lib/db";

type ClientWithCounts = Prisma.ClientGetPayload<{
  include: { _count: { select: { projects: true } } };
}>;

export const dynamic = "force-dynamic";

async function getClients(): Promise<ClientWithCounts[]> {
  try {
    return await prisma.client.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching clients (Safe Mode):", error);
    return [];
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300";
    case "inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    case "at-risk":
    case "at_risk":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300";
    case "churned":
      return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "at_risk":
    case "at-risk":
      return "Payment Declined";
    case "churned":
      return "Canceled";
    default:
      return status;
  }
};

const getHealthScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);

const getWebsiteLabel = (website?: string | null) => {
  if (!website) return null;
  try {
    const url = new URL(website);
    return url.host;
  } catch {
    return website.replace(/^https?:\/\//, "");
  }
};

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships and contact information.
          </p>
        </div>
        <NewClientDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Overview</CardTitle>
          <CardDescription>
            A comprehensive view of all clients with their health status and
            project activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mb-4" />
              <p className="text-sm">
                No clients yet. Add your first client to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.website && (
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{getWebsiteLabel(client.website)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {client.industry && (
                          <Badge variant="secondary">{client.industry}</Badge>
                        )}
                        <Badge className={getStatusColor(client.status)}>
                          {getStatusLabel(client.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${getHealthScoreColor(client.healthScore)}`}
                        >
                          {client.healthScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Health Score
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {client._count.projects}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Projects
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Since {formatDate(client.createdAt)}
                    </div>
                    <ClientActions client={client} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

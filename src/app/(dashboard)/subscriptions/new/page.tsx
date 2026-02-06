"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewSubscriptionPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        clientId: "",
        name: "",
        description: "",
        amount: "",
        billingCadence: "monthly",
        startDate: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        fetch("/api/clients")
            .then((res) => res.json())
            .then((data) => setClients(data))
            .catch((err) => console.error("Error loading clients:", err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to create subscription");
            }

            router.push("/finance");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create subscription");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" asChild className="mb-2">
                        <Link href="/finance">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Finance
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Add Subscription</h1>
                    <p className="text-muted-foreground">
                        Create a new recurring subscription for a client
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Details</CardTitle>
                        <CardDescription>Fill in the subscription information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="client">Client *</Label>
                            <select
                                id="client"
                                required
                                value={formData.clientId}
                                onChange={(e) =>
                                    setFormData({ ...formData, clientId: e.target.value })
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select a client</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Service Name *</Label>
                            <Input
                                id="name"
                                required
                                placeholder="e.g., Website Maintenance, Marketing Retainer"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                placeholder="Service description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount ($) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="billingCadence">Billing Cadence *</Label>
                                <select
                                    id="billingCadence"
                                    required
                                    value={formData.billingCadence}
                                    onChange={(e) =>
                                        setFormData({ ...formData, billingCadence: e.target.value })
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="annual">Annual</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/finance">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Subscription"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

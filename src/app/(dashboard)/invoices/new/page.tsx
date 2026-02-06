"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type LineItem = {
    description: string;
    quantity: number;
    rate: number;
};

export default function NewInvoicePage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        clientId: "",
        dueDate: "",
        description: "",
        notes: "",
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: "", quantity: 1, rate: 0 },
    ]);

    useEffect(() => {
        fetch("/api/clients")
            .then((res) => res.json())
            .then((data) => setClients(data))
            .catch((err) => console.error("Error loading clients:", err));
    }, []);

    const addLineItem = () => {
        setLineItems([...lineItems, { description: "", quantity: 1, rate: 0 }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setLineItems(updated);
    };

    const calculateTotal = () => {
        return lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const total = calculateTotal();
            const response = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    amount: total,
                    lineItems,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create invoice");
            }

            router.push("/finance");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create invoice");
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
                    <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
                    <p className="text-muted-foreground">
                        Generate a new invoice for a client
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                        <CardDescription>Fill in the invoice information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
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
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dueDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="Invoice description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Line Items</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Item
                                </Button>
                            </div>

                            {lineItems.map((item, index) => (
                                <div key={index} className="grid gap-4 md:grid-cols-12 items-end">
                                    <div className="md:col-span-5 space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            placeholder="Item description"
                                            value={item.description}
                                            onChange={(e) =>
                                                updateLineItem(index, "description", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateLineItem(index, "quantity", parseInt(e.target.value))
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Rate ($)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.rate}
                                            onChange={(e) =>
                                                updateLineItem(index, "rate", parseFloat(e.target.value))
                                            }
                                        />
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <Label>Total</Label>
                                        <div className="text-sm font-medium py-2">
                                            ${(item.quantity * item.rate).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        {lineItems.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLineItem(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4 border-t">
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground">Total Amount</div>
                                    <div className="text-2xl font-bold">${calculateTotal().toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                placeholder="Additional notes"
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                {isSubmitting ? "Creating..." : "Create Invoice"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

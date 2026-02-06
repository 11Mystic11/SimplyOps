"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        clientId: "",
        projectId: "",
    });

    useEffect(() => {
        loadExpenses();
        loadClients();
        loadProjects();
    }, []);

    const loadExpenses = async () => {
        try {
            const res = await fetch("/api/expenses");
            const data = await res.json();
            setExpenses(data);
        } catch (err) {
            console.error("Error loading expenses:", err);
        }
    };

    const loadClients = async () => {
        try {
            const res = await fetch("/api/clients");
            const data = await res.json();
            setClients(data);
        } catch (err) {
            console.error("Error loading clients:", err);
        }
    };

    const loadProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            setProjects(data);
        } catch (err) {
            console.error("Error loading projects:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to create expense");
            }

            setFormData({
                category: "",
                amount: "",
                description: "",
                date: new Date().toISOString().split("T")[0],
                clientId: "",
                projectId: "",
            });
            setIsDialogOpen(false);
            loadExpenses();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create expense");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            software: "bg-blue-100 text-blue-800",
            hardware: "bg-purple-100 text-purple-800",
            marketing: "bg-green-100 text-green-800",
            travel: "bg-yellow-100 text-yellow-800",
            office: "bg-gray-100 text-gray-800",
        };
        return colors[category.toLowerCase()] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">
                        Track and manage business expenses
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                            <DialogDescription>
                                Record a new business expense
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <select
                                        id="category"
                                        required
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select category</option>
                                        <option value="Software">Software</option>
                                        <option value="Hardware">Hardware</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
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

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Input
                                        id="description"
                                        required
                                        placeholder="Expense description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, date: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="client">Client (Optional)</Label>
                                    <select
                                        id="client"
                                        value={formData.clientId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, clientId: e.target.value })
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">None</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="project">Project (Optional)</Label>
                                    <select
                                        id="project"
                                        value={formData.projectId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, projectId: e.target.value })
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">None</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive mb-4" role="alert">
                                    {error}
                                </p>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Adding..." : "Add Expense"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Total Expenses</span>
                        <span className="text-2xl">${totalExpenses.toFixed(2)}</span>
                    </CardTitle>
                    <CardDescription>All recorded business expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    {expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <DollarSign className="h-10 w-10 mb-4" />
                            <p className="text-sm">
                                No expenses yet. Add your first expense to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={getCategoryColor(expense.category)}>
                                                {expense.category}
                                            </Badge>
                                            <span className="font-medium">{expense.description}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(expense.date).toLocaleDateString()}
                                            {expense.client && ` • ${expense.client.name}`}
                                            {expense.project && ` • ${expense.project.name}`}
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold">
                                        ${expense.amount.toFixed(2)}
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

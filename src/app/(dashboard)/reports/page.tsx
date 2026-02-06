"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, CreditCard, AlertTriangle } from "lucide-react";

export default function ReportsPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [invoicesRes, subscriptionsRes, expensesRes] = await Promise.all([
                fetch("/api/invoices"),
                fetch("/api/subscriptions"),
                fetch("/api/expenses"),
            ]);

            setInvoices(await invoicesRes.json());
            setSubscriptions(await subscriptionsRes.json());
            setExpenses(await expensesRes.json());
        } catch (err) {
            console.error("Error loading data:", err);
        }
    };

    // Calculate metrics
    const totalRevenue = invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount, 0);

    const outstandingInvoices = invoices
        .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
        .reduce((sum, inv) => sum + inv.amount, 0);

    const monthlyRecurringRevenue = subscriptions
        .filter((sub) => sub.status === "active")
        .reduce((sum, sub) => {
            const monthly =
                sub.billingCadence === "annual"
                    ? sub.amount / 12
                    : sub.billingCadence === "quarterly"
                        ? sub.amount / 3
                        : sub.amount;
            return sum + monthly;
        }, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const stats = [
        {
            title: "Total Revenue",
            value: `$${totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            trend: "up",
            description: "From paid invoices",
        },
        {
            title: "Monthly Recurring Revenue",
            value: `$${monthlyRecurringRevenue.toFixed(2)}`,
            icon: TrendingUp,
            trend: "up",
            description: `${subscriptions.filter((s) => s.status === "active").length} active subscriptions`,
        },
        {
            title: "Outstanding Invoices",
            value: `$${outstandingInvoices.toFixed(2)}`,
            icon: AlertTriangle,
            trend: "neutral",
            description: `${invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").length} unpaid invoices`,
        },
        {
            title: "Total Expenses",
            value: `$${totalExpenses.toFixed(2)}`,
            icon: CreditCard,
            trend: "down",
            description: `${expenses.length} recorded expenses`,
        },
    ];

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                <p className="text-muted-foreground">
                    Overview of revenue, expenses, and profitability
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Profitability */}
            <Card>
                <CardHeader>
                    <CardTitle>Profitability</CardTitle>
                    <CardDescription>Revenue vs Expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total Revenue</span>
                            <span className="text-lg font-bold text-green-600">
                                ${totalRevenue.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total Expenses</span>
                            <span className="text-lg font-bold text-red-600">
                                -${totalExpenses.toFixed(2)}
                            </span>
                        </div>
                        <div className="border-t pt-4 flex justify-between items-center">
                            <span className="text-sm font-medium">Gross Profit</span>
                            <span className={`text-2xl font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                ${grossProfit.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Profit Margin</span>
                            <Badge variant={profitMargin >= 50 ? "default" : "secondary"}>
                                {profitMargin.toFixed(1)}%
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Expense Breakdown by Category</CardTitle>
                    <CardDescription>Where your money is going</CardDescription>
                </CardHeader>
                <CardContent>
                    {Object.keys(expensesByCategory).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No expenses recorded yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(expensesByCategory)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .map(([category, amt]) => {
                                    const amount = amt as number;
                                    const percentage = (amount / totalExpenses) * 100;
                                    return (
                                        <div key={category} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{category}</span>
                                                <span className="text-muted-foreground">
                                                    ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Invoices</CardTitle>
                    <CardDescription>Latest invoice activity</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No invoices yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {invoices.slice(0, 5).map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {invoice.client.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">${invoice.amount.toFixed(2)}</p>
                                        <Badge
                                            variant={
                                                invoice.status === "paid"
                                                    ? "default"
                                                    : invoice.status === "overdue"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                        >
                                            {invoice.status}
                                        </Badge>
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

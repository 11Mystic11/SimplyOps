"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  Download,
  Eye,
  Receipt,
} from "lucide-react";
import Link from "next/link";

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Error loading finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const activeSubscriptionsCount = subscriptions.filter(
    (sub) => sub.status === "active"
  ).length;

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

  const outstandingInvoices = invoices
    .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const financeStats = [
    {
      title: "Monthly Recurring Revenue",
      value: `$${monthlyRecurringRevenue.toFixed(2)}`,
      change: `${activeSubscriptionsCount} active subscriptions`,
      trend: "up",
      icon: CreditCard,
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      change: "From paid invoices",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Outstanding Invoices",
      value: `$${outstandingInvoices.toFixed(2)}`,
      change: `${invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").length} unpaid`,
      trend: outstandingInvoices > 0 ? "down" : "neutral",
      icon: AlertTriangle,
    },
    {
      title: "Profit Margin",
      value: `${profitMargin.toFixed(1)}%`,
      change: `Gross profit: $${grossProfit.toFixed(2)}`,
      trend: profitMargin >= 50 ? "up" : "neutral",
      icon: TrendingUp,
    },
  ];

  // Get recent invoices for transactions
  const recentInvoices = invoices.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">
          Manage subscriptions, invoices, payments, and profitability.
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common financial operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-5">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/billing">
                <Receipt className="mr-2 h-4 w-4" />
                Smart Invoice
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/invoices/new">
                <DollarSign className="mr-2 h-4 w-4" />
                Quick Invoice
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/subscriptions/new">
                <Users className="mr-2 h-4 w-4" />
                Add Subscription
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/reports">
                <Eye className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/expenses">
                <CreditCard className="mr-2 h-4 w-4" />
                Track Expenses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financeStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {stat.trend === "up" && (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                )}
                {stat.trend === "down" && (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart Placeholder */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly recurring and project revenue trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Revenue Chart</p>
                <p className="text-sm">Chart visualization will appear here</p>
                <p className="text-xs">Showing MRR growth over last 6 months</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/reports">
                <Eye className="mr-2 h-4 w-4" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <DollarSign className="h-10 w-10 mb-4" />
                <p className="text-sm">No invoices yet. Create your first invoice to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>Client: {invoice.client.name}</span>
                          <span>
                            {new Date(invoice.issuedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${invoice.amount.toLocaleString()}
                      </div>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : invoice.status === "overdue"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Active Subscriptions</CardTitle>
          <Button variant="outline" asChild>
            <Link href="/subscriptions/new">
              <Calendar className="mr-2 h-4 w-4" />
              Add Subscription
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {subscriptions.filter((s) => s.status === "active").length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mb-4" />
              <p className="text-sm">
                No active subscriptions. Add your first subscription to track recurring revenue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions
                .filter((s) => s.status === "active")
                .map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{subscription.name}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {subscription.status}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Client: {subscription.client.name}</span>
                        <span>{subscription.billingCadence}</span>
                        <span>${subscription.amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Next Billing
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(subscription.nextBilling).toLocaleDateString()}
                      </div>
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
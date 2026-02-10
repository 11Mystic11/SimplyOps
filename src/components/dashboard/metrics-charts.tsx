"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// Demo data — wire to real Stripe/CRM data via API
const ltgpCacData = [
    { month: "Sep", ratio: 2.8 },
    { month: "Oct", ratio: 3.1 },
    { month: "Nov", ratio: 3.4 },
    { month: "Dec", ratio: 3.2 },
    { month: "Jan", ratio: 3.8 },
    { month: "Feb", ratio: 4.2 },
];

const churnData = [
    { month: "Sep", churn: 5.2, retention: 94.8 },
    { month: "Oct", churn: 4.8, retention: 95.2 },
    { month: "Nov", churn: 4.1, retention: 95.9 },
    { month: "Dec", churn: 3.5, retention: 96.5 },
    { month: "Jan", churn: 3.2, retention: 96.8 },
    { month: "Feb", churn: 2.9, retention: 97.1 },
];

const speedToLeadData = [
    { day: "Mon", minutes: 2.1 },
    { day: "Tue", minutes: 1.8 },
    { day: "Wed", minutes: 1.5 },
    { day: "Thu", minutes: 1.2 },
    { day: "Fri", minutes: 0.9 },
    { day: "Sat", minutes: 3.2 },
    { day: "Sun", minutes: 4.1 },
];

const revenueData = [
    { month: "Sep", revenue: 8200, costs: 2100 },
    { month: "Oct", revenue: 9800, costs: 2300 },
    { month: "Nov", revenue: 11400, costs: 2200 },
    { month: "Dec", revenue: 10900, costs: 2400 },
    { month: "Jan", revenue: 13200, costs: 2500 },
    { month: "Feb", revenue: 15600, costs: 2800 },
];

const chartTheme = {
    purple: "#9333ea",
    green: "#22c55e",
    red: "#ef4444",
    teal: "#14b8a6",
    muted: "#52525b",
    grid: "#27272a",
};

export function MetricsCharts() {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-gradient flex items-center gap-2">
                <Target className="h-5 w-5" />
                Growth Analytics
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
                {/* LTGP:CAC Ratio */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="glass-card">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                    LTGP:CAC Ratio
                                </CardTitle>
                                <div className="flex items-center gap-1 text-green-500">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">+10.5%</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold">4.2x</p>
                            <p className="text-[10px] text-muted-foreground">Target: &gt;3x for scalability</p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={120}>
                                <AreaChart data={ltgpCacData}>
                                    <defs>
                                        <linearGradient id="ltgpGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={chartTheme.purple} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={chartTheme.purple} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: chartTheme.muted }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                                        labelStyle={{ color: "#a1a1aa" }}
                                    />
                                    <Area type="monotone" dataKey="ratio" stroke={chartTheme.purple} fill="url(#ltgpGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Churn & Retention */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="glass-card">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                    Churn & Retention
                                </CardTitle>
                                <div className="flex items-center gap-1 text-green-500">
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">-0.3% churn</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold">97.1% <span className="text-sm font-normal text-muted-foreground">retained</span></p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={120}>
                                <AreaChart data={churnData}>
                                    <defs>
                                        <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={chartTheme.green} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={chartTheme.green} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: chartTheme.muted }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                                        labelStyle={{ color: "#a1a1aa" }}
                                    />
                                    <Area type="monotone" dataKey="retention" stroke={chartTheme.green} fill="url(#retentionGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Speed to Lead */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="glass-card">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                    Speed to Lead
                                </CardTitle>
                                <div className="flex items-center gap-1 text-teal-500">
                                    <Zap className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">avg 1.2m</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold">1.2 <span className="text-sm font-normal text-muted-foreground">min avg</span></p>
                            <p className="text-[10px] text-muted-foreground">Target: &lt;5 min response time</p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={speedToLeadData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: chartTheme.muted }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                                        labelStyle={{ color: "#a1a1aa" }}
                                        formatter={(value: number) => [`${value}m`, "Response Time"]}
                                    />
                                    <Bar dataKey="minutes" fill={chartTheme.teal} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Revenue vs Costs */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="glass-card">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                    Revenue vs Costs
                                </CardTitle>
                                <div className="flex items-center gap-1 text-green-500">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">82% margin</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold">$15.6k <span className="text-sm font-normal text-muted-foreground">this month</span></p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: chartTheme.muted }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                                        labelStyle={{ color: "#a1a1aa" }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke={chartTheme.green} strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="costs" stroke={chartTheme.red} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

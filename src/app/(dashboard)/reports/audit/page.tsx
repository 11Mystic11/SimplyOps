"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Download,
    TrendingUp,
    Clock,
    DollarSign,
    CheckCircle,
    BarChart3,
    Zap,
    Users,
    ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Demo data — wire to real Prisma queries
const reportData = {
    clientName: "Hawkins Services",
    reportDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    period: "Month 1",
    summary: {
        hoursSaved: 42,
        revenueCaptured: 8400,
        automationsActive: 6,
        uptime: 99.97,
        leadsProcessed: 312,
        meetingsBooked: 47,
        responseTime: 1.2,
        costReduction: 62,
    },
    automations: [
        { name: "Lead Surge Router", runs: 312, saved: "18 hrs", status: "healthy" },
        { name: "After-Hours AI Agent", runs: 89, saved: "12 hrs", status: "healthy" },
        { name: "Contract Renewal Reminder", runs: 34, saved: "4 hrs", status: "healthy" },
        { name: "CRM Sync Pipeline", runs: 1240, saved: "6 hrs", status: "healthy" },
        { name: "Email Drip Sequencer", runs: 156, saved: "2 hrs", status: "healthy" },
        { name: "Invoice Generator", runs: 28, saved: "1 hr", status: "warning" },
    ],
    roi: {
        monthlyCost: 2500,
        valueGenerated: 8400,
        roiMultiple: 3.4,
        projectedAnnual: 100800,
    },
    recommendations: [
        "Add SMS follow-up to after-hours leads — projected +15% conversion",
        "Implement warranty expiry tracking — estimated $3k/mo in renewals",
        "Connect Google Reviews automation — boost social proof by 40%",
    ],
};

export default function AuditReportPage() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header with print button */}
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="h-7 w-7 text-primary" />
                        Performance Audit Report
                    </h1>
                    <p className="text-muted-foreground">
                        {reportData.clientName} — {reportData.period} ({reportData.reportDate})
                    </p>
                </div>
                <Button onClick={handlePrint} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export PDF
                </Button>
            </div>

            {/* Print-friendly report content */}
            <div className="print:text-black print:bg-white">
                {/* Print header */}
                <div className="hidden print:block mb-8">
                    <h1 className="text-2xl font-bold">Simply Automations — Performance Audit</h1>
                    <p className="text-gray-600">{reportData.clientName} | {reportData.period} | {reportData.reportDate}</p>
                    <hr className="mt-4" />
                </div>

                {/* Executive Summary */}
                <Card className="glass-card print:border print:shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Executive Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SummaryCard
                                icon={Clock}
                                label="Hours Saved"
                                value={`${reportData.summary.hoursSaved}`}
                                suffix="hrs"
                                color="text-blue-500"
                            />
                            <SummaryCard
                                icon={DollarSign}
                                label="Revenue Captured"
                                value={`$${reportData.summary.revenueCaptured.toLocaleString()}`}
                                color="text-green-500"
                            />
                            <SummaryCard
                                icon={Users}
                                label="Leads Processed"
                                value={`${reportData.summary.leadsProcessed}`}
                                color="text-purple-500"
                            />
                            <SummaryCard
                                icon={Zap}
                                label="Meetings Booked"
                                value={`${reportData.summary.meetingsBooked}`}
                                color="text-teal-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <SummaryCard
                                icon={CheckCircle}
                                label="Uptime"
                                value={`${reportData.summary.uptime}%`}
                                color="text-green-500"
                            />
                            <SummaryCard
                                icon={TrendingUp}
                                label="Response Time"
                                value={`${reportData.summary.responseTime}m`}
                                color="text-cyan-500"
                            />
                            <SummaryCard
                                icon={BarChart3}
                                label="Automations Active"
                                value={`${reportData.summary.automationsActive}`}
                                color="text-orange-500"
                            />
                            <SummaryCard
                                icon={ArrowUpRight}
                                label="Cost Reduction"
                                value={`${reportData.summary.costReduction}%`}
                                color="text-pink-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Automation Performance Table */}
                <Card className="glass-card print:border print:shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Automation Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800 print:border-gray-300">
                                        <th className="text-left py-3 px-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Automation</th>
                                        <th className="text-right py-3 px-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Executions</th>
                                        <th className="text-right py-3 px-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Time Saved</th>
                                        <th className="text-right py-3 px-2 font-semibold text-muted-foreground uppercase text-xs tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.automations.map((auto, i) => (
                                        <motion.tr
                                            key={auto.name}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-zinc-800/50 print:border-gray-200"
                                        >
                                            <td className="py-3 px-2 font-medium">{auto.name}</td>
                                            <td className="py-3 px-2 text-right font-mono">{auto.runs.toLocaleString()}</td>
                                            <td className="py-3 px-2 text-right">{auto.saved}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                                    auto.status === "healthy" ? "text-green-500" : "text-yellow-500"
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        auto.status === "healthy" ? "bg-green-500" : "bg-yellow-500"
                                                    }`} />
                                                    {auto.status === "healthy" ? "Healthy" : "Needs Attention"}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* ROI Analysis */}
                <Card className="glass-card print:border print:shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            ROI Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center p-4 rounded-xl bg-zinc-900/30 print:bg-gray-50 print:border">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly Investment</p>
                                <p className="text-2xl font-bold">${reportData.roi.monthlyCost.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-green-500/5 border border-green-500/10 print:bg-green-50 print:border-green-200">
                                <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Value Generated</p>
                                <p className="text-2xl font-bold text-green-500">${reportData.roi.valueGenerated.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 print:bg-purple-50 print:border-purple-200">
                                <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">ROI Multiple</p>
                                <p className="text-2xl font-bold text-purple-500">{reportData.roi.roiMultiple}x</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-zinc-900/30 print:bg-gray-50 print:border">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Projected Annual</p>
                                <p className="text-2xl font-bold">${reportData.roi.projectedAnnual.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="glass-card print:border print:shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Next Month Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {reportData.recommendations.map((rec, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 print:bg-purple-50 print:border-purple-200"
                                >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm">{rec}</p>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    suffix,
    color,
}: {
    icon: typeof Clock;
    label: string;
    value: string;
    suffix?: string;
    color: string;
}) {
    return (
        <div className="text-center p-3 rounded-lg bg-zinc-900/30 print:bg-gray-50 print:border">
            <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
            <p className="text-lg font-bold">
                {value}
                {suffix && <span className="text-xs text-muted-foreground ml-1">{suffix}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    );
}

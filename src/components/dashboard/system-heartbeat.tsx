"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle, AlertTriangle, XCircle, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorkflowStatus = "healthy" | "warning" | "error" | "offline";

interface Workflow {
    name: string;
    status: WorkflowStatus;
    lastRun: string;
    executions24h: number;
    avgDuration: string;
}

const statusConfig: Record<WorkflowStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string; pulse: boolean }> = {
    healthy: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500", label: "Healthy", pulse: true },
    warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500", label: "Warning", pulse: true },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500", label: "Error", pulse: false },
    offline: { icon: Wifi, color: "text-zinc-500", bg: "bg-zinc-500", label: "Offline", pulse: false },
};

// Demo data — replace with real n8n API calls
const workflows: Workflow[] = [
    { name: "Lead Surge Router", status: "healthy", lastRun: "2 min ago", executions24h: 47, avgDuration: "1.2s" },
    { name: "After-Hours AI Agent", status: "healthy", lastRun: "12 min ago", executions24h: 23, avgDuration: "3.4s" },
    { name: "Contract Renewal Reminder", status: "healthy", lastRun: "1 hr ago", executions24h: 8, avgDuration: "2.1s" },
    { name: "Invoice Generator", status: "warning", lastRun: "3 hr ago", executions24h: 5, avgDuration: "4.8s" },
    { name: "CRM Sync Pipeline", status: "healthy", lastRun: "5 min ago", executions24h: 156, avgDuration: "0.8s" },
    { name: "Email Drip Sequencer", status: "healthy", lastRun: "30 min ago", executions24h: 34, avgDuration: "1.5s" },
];

function StatusDot({ status }: { status: WorkflowStatus }) {
    const config = statusConfig[status];
    return (
        <span className="relative flex h-2.5 w-2.5">
            {config.pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bg} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.bg}`} />
        </span>
    );
}

export function SystemHeartbeat() {
    const healthyCount = workflows.filter((w) => w.status === "healthy").length;
    const totalCount = workflows.length;
    const allHealthy = healthyCount === totalCount;

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        System Heartbeat
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <StatusDot status={allHealthy ? "healthy" : "warning"} />
                        <span className={`text-xs font-semibold ${allHealthy ? "text-green-500" : "text-yellow-500"}`}>
                            {healthyCount}/{totalCount} Online
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Heartbeat visualization */}
                <div className="relative h-12 mb-4 overflow-hidden rounded-lg bg-zinc-900/30 border border-white/5">
                    <svg className="w-full h-full" viewBox="0 0 400 48" preserveAspectRatio="none">
                        <motion.path
                            d="M0 24 L40 24 L50 8 L60 40 L70 24 L100 24 L140 24 L150 8 L160 40 L170 24 L200 24 L240 24 L250 8 L260 40 L270 24 L300 24 L340 24 L350 8 L360 40 L370 24 L400 24"
                            fill="none"
                            stroke={allHealthy ? "#22c55e" : "#eab308"}
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M0 24 L40 24 L50 8 L60 40 L70 24 L100 24 L140 24 L150 8 L160 40 L170 24 L200 24 L240 24 L250 8 L260 40 L270 24 L300 24 L340 24 L350 8 L360 40 L370 24 L400 24"
                            fill="none"
                            stroke={allHealthy ? "#22c55e" : "#eab308"}
                            strokeWidth="2"
                            opacity="0.2"
                            filter="blur(4px)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    </svg>
                </div>

                {/* Workflow list */}
                <div className="space-y-1.5">
                    {workflows.map((wf, i) => {
                        const config = statusConfig[wf.status];
                        const Icon = config.icon;
                        return (
                            <motion.div
                                key={wf.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{wf.name}</p>
                                        <p className="text-[10px] text-muted-foreground">Last: {wf.lastRun}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-mono">{wf.executions24h} runs</p>
                                        <p className="text-[10px] text-muted-foreground">avg {wf.avgDuration}</p>
                                    </div>
                                    <StatusDot status={wf.status} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

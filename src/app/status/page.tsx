"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Activity, Clock, Shield } from "lucide-react";

type Status = "operational" | "degraded" | "outage";

interface ServiceStatus {
    name: string;
    status: Status;
    uptime: string;
    lastIncident: string;
}

const statusConfig: Record<Status, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
    operational: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500", label: "Operational" },
    degraded: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500", label: "Degraded" },
    outage: { icon: XCircle, color: "text-red-500", bg: "bg-red-500", label: "Outage" },
};

// Demo data — wire to real monitoring
const services: ServiceStatus[] = [
    { name: "Lead Routing Engine", status: "operational", uptime: "99.98%", lastIncident: "32 days ago" },
    { name: "AI Voice Agent", status: "operational", uptime: "99.95%", lastIncident: "14 days ago" },
    { name: "CRM Sync Pipeline", status: "operational", uptime: "99.99%", lastIncident: "61 days ago" },
    { name: "Email Automation", status: "operational", uptime: "99.97%", lastIncident: "7 days ago" },
    { name: "Payment Processing", status: "operational", uptime: "100%", lastIncident: "Never" },
    { name: "Calendar Integration", status: "operational", uptime: "99.96%", lastIncident: "21 days ago" },
    { name: "SMS Notifications", status: "operational", uptime: "99.94%", lastIncident: "3 days ago" },
    { name: "Reporting Dashboard", status: "operational", uptime: "99.99%", lastIncident: "45 days ago" },
];

const uptimeHistory = Array.from({ length: 90 }, (_, i) => {
    const rand = Math.random();
    if (rand > 0.97) return "degraded" as Status;
    if (rand > 0.99) return "outage" as Status;
    return "operational" as Status;
});

function StatusDot({ status }: { status: Status }) {
    const config = statusConfig[status];
    return (
        <span className="relative flex h-2.5 w-2.5">
            {status === "operational" && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bg} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.bg}`} />
        </span>
    );
}

export default function StatusPage() {
    const allOperational = services.every((s) => s.status === "operational");

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <div className="border-b border-zinc-800">
                <div className="max-w-3xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">SA</span>
                        </div>
                        <h1 className="text-xl font-bold">Simply Automations Status</h1>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border ${
                            allOperational
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-yellow-500/10 border-yellow-500/20"
                        }`}
                    >
                        {allOperational ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-yellow-500" />
                        )}
                        <div>
                            <p className={`font-semibold ${allOperational ? "text-green-400" : "text-yellow-400"}`}>
                                {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
                            </p>
                            <p className="text-sm text-zinc-400">
                                Last checked: {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Services */}
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="space-y-2">
                    {services.map((service, i) => {
                        const config = statusConfig[service.status];
                        const Icon = config.icon;
                        return (
                            <motion.div
                                key={service.name}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <StatusDot status={service.status} />
                                    <span className="font-medium">{service.name}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs text-zinc-400">{service.uptime} uptime</p>
                                    </div>
                                    <span className={`text-xs font-semibold ${config.color}`}>
                                        {config.label}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* 90-day uptime bar */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
                            90-Day Uptime
                        </h2>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            Updated every 5 min
                        </div>
                    </div>
                    <div className="flex gap-0.5">
                        {uptimeHistory.map((status, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-8 rounded-sm ${
                                    status === "operational"
                                        ? "bg-green-500/60"
                                        : status === "degraded"
                                        ? "bg-yellow-500/60"
                                        : "bg-red-500/60"
                                }`}
                                title={`Day ${90 - i}: ${statusConfig[status].label}`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-zinc-600">90 days ago</span>
                        <span className="text-[10px] text-zinc-600">Today</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-zinc-800 flex items-center justify-between text-zinc-500 text-xs">
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Powered by Simply Automations</span>
                    </div>
                    <span>© {new Date().getFullYear()}</span>
                </div>
            </div>
        </div>
    );
}

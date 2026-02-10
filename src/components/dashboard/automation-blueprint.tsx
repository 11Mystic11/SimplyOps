"use client";

import { motion } from "framer-motion";
import { Zap, Globe, Mail, Phone, Database, Calendar, CreditCard, Bot, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FlowNode {
    id: string;
    label: string;
    icon: typeof Zap;
    type: "trigger" | "action" | "condition" | "output";
    color: string;
}

interface FlowConnection {
    from: string;
    to: string;
}

const nodes: FlowNode[] = [
    { id: "trigger", label: "Inbound Lead", icon: Globe, type: "trigger", color: "bg-blue-500" },
    { id: "ai", label: "AI Triage", icon: Bot, type: "condition", color: "bg-purple-500" },
    { id: "crm", label: "CRM Update", icon: Database, type: "action", color: "bg-green-500" },
    { id: "calendar", label: "Book Meeting", icon: Calendar, type: "action", color: "bg-teal-500" },
    { id: "email", label: "Drip Sequence", icon: Mail, type: "action", color: "bg-orange-500" },
    { id: "sms", label: "SMS Follow-up", icon: Phone, type: "action", color: "bg-pink-500" },
    { id: "invoice", label: "Auto-Invoice", icon: CreditCard, type: "output", color: "bg-yellow-500" },
];

const typeColors: Record<string, string> = {
    trigger: "border-blue-500/30",
    action: "border-green-500/30",
    condition: "border-purple-500/30",
    output: "border-yellow-500/30",
};

export function AutomationBlueprint() {
    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Automation Blueprint
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Flow visualization */}
                <div className="relative">
                    {/* Row 1: Trigger → AI → CRM */}
                    <div className="flex items-center gap-2 mb-6">
                        {[nodes[0], nodes[1], nodes[2]].map((node, i) => (
                            <div key={node.id} className="flex items-center gap-2">
                                <FlowNodeCard node={node} delay={i * 0.1} />
                                {i < 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, scaleX: 0 }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        transition={{ delay: i * 0.1 + 0.2 }}
                                    >
                                        <ArrowRight className="w-4 h-4 text-zinc-600" />
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Row 2: Branch outputs */}
                    <div className="ml-8 border-l-2 border-dashed border-zinc-700 pl-6 space-y-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest -ml-3">Parallel Actions</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[nodes[3], nodes[4], nodes[5], nodes[6]].map((node, i) => (
                                <FlowNodeCard key={node.id} node={node} delay={0.4 + i * 0.08} compact />
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-6 pt-4 border-t border-zinc-800">
                        {["trigger", "condition", "action", "output"].map((type) => (
                            <div key={type} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    type === "trigger" ? "bg-blue-500" :
                                    type === "condition" ? "bg-purple-500" :
                                    type === "action" ? "bg-green-500" : "bg-yellow-500"
                                }`} />
                                <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function FlowNodeCard({ node, delay = 0, compact = false }: { node: FlowNode; delay?: number; compact?: boolean }) {
    const Icon = node.icon;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
            className={`flex items-center gap-2 rounded-lg border ${typeColors[node.type]} bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-default ${
                compact ? "px-2.5 py-1.5" : "px-3 py-2"
            }`}
        >
            <div className={`${compact ? "w-5 h-5" : "w-6 h-6"} rounded-md ${node.color} flex items-center justify-center`}>
                <Icon className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} text-white`} />
            </div>
            <span className={`font-medium ${compact ? "text-[11px]" : "text-xs"}`}>
                {node.label}
            </span>
        </motion.div>
    );
}

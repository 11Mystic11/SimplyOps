"use client";

import { motion } from "framer-motion";
import { Activity, Zap, Layers, BarChart3 } from "lucide-react";
import { AnimateNumber } from "motion-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
    title: string;
    value: number;
    suffix?: string;
    prefix?: string;
    description: string;
    icon: any;
    delay?: number;
    isPercentage?: boolean;
}

function MetricCard({ title, value, suffix, prefix, description, icon: Icon, delay = 0, isPercentage }: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="glass-card border-white/5 bg-zinc-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest leading-none">
                        {title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-primary opacity-70" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold tracking-tighter">
                        {prefix && <span className="text-lg font-normal text-muted-foreground mr-1">{prefix}</span>}
                        <AnimateNumber
                            format={isPercentage ? { style: 'percent' } : { minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                        >
                            {value}
                        </AnimateNumber>
                        {suffix && <span className="text-lg font-normal text-muted-foreground ml-1">{suffix}</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">
                        {description}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function MasterMetrics() {
    const metrics = [
        {
            title: "LTGP:CAC Ratio",
            value: 4.2,
            suffix: "x",
            description: "Scale Probability: Elite",
            icon: Activity,
        },
        {
            title: "Gross Margin",
            value: 0.82,
            isPercentage: true,
            description: "Operational Efficiency",
            icon: Layers,
        },
        {
            title: "Churn Rate",
            value: 0.03,
            isPercentage: true,
            description: "Retention Stability",
            icon: BarChart3,
        },
        {
            title: "Speed to Lead",
            value: 1.2,
            suffix: "m",
            description: "Average Response Time",
            icon: Zap,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
            {metrics.map((metric, i) => (
                <MetricCard key={metric.title} {...metric} delay={i * 0.1} />
            ))}
        </div>
    );
}

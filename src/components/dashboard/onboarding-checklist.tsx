"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, ChevronRight, Trophy, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    completed: boolean;
}

const defaultItems: ChecklistItem[] = [
    { id: "access", title: "Grant system access", description: "Provide CRM, calendar, and payment tool credentials", completed: true },
    { id: "audit", title: "Complete business audit", description: "Review current workflows and identify automation opportunities", completed: true },
    { id: "blueprint", title: "Approve automation blueprint", description: "Review and sign off on the proposed automation architecture", completed: true },
    { id: "build", title: "Build & configure automations", description: "Set up n8n workflows, AI agents, and integrations", completed: false },
    { id: "test", title: "QA & stress testing", description: "Run real-world scenarios through every automation", completed: false },
    { id: "train", title: "Team training session", description: "30-min live walkthrough of all new automations with your team", completed: false },
    { id: "handoff", title: "Playbook delivery & handoff", description: "Receive documented SOPs and support escalation paths", completed: false },
    { id: "review", title: "30-day performance review", description: "Analyze ROI metrics and fine-tune automations", completed: false },
];

export function OnboardingChecklist() {
    const [items, setItems] = useState(defaultItems);
    const completedCount = items.filter((i) => i.completed).length;
    const totalCount = items.length;
    const progress = (completedCount / totalCount) * 100;
    const allDone = completedCount === totalCount;

    const toggleItem = (id: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            )
        );
    };

    // Find current step (first incomplete)
    const currentStepIndex = items.findIndex((i) => !i.completed);

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Client Onboarding
                    </CardTitle>
                    <span className="text-xs font-semibold text-primary">
                        {completedCount}/{totalCount} complete
                    </span>
                </div>

                {/* Progress bar */}
                <div className="relative mt-3">
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {allDone ? "Implementation complete!" : `Step ${currentStepIndex + 1} of ${totalCount}`}
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-1">
                {items.map((item, i) => {
                    const isCurrent = i === currentStepIndex;
                    return (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => toggleItem(item.id)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all group ${
                                isCurrent
                                    ? "bg-primary/10 border border-primary/20"
                                    : "hover:bg-white/5"
                            }`}
                        >
                            {/* Checkbox */}
                            <div className="flex-shrink-0 mt-0.5">
                                <AnimatePresence mode="wait">
                                    {item.completed ? (
                                        <motion.div
                                            key="checked"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                                        >
                                            <Check className="w-3 h-3 text-white" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="unchecked"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Circle className={`w-5 h-5 ${isCurrent ? "text-primary" : "text-zinc-600"}`} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                                    {item.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    {item.description}
                                </p>
                            </div>

                            {/* Arrow for current */}
                            {isCurrent && (
                                <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                            )}
                        </motion.button>
                    );
                })}

                {/* Completion celebration */}
                <AnimatePresence>
                    {allDone && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-center gap-2 p-4 mt-2 bg-gradient-to-r from-primary/10 to-purple-400/10 rounded-lg border border-primary/20"
                        >
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <p className="text-sm font-semibold text-primary">
                                Onboarding Complete!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

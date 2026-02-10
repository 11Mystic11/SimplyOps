"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, DollarSign } from "lucide-react";
import { AnimateNumber } from "motion-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RealTimeROIProps {
    hoursSaved: number;
    moneySaved: number;
    multiple: number;
}

export function RealTimeROI({ hoursSaved, moneySaved, multiple }: RealTimeROIProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="glass-card overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="w-12 h-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Efficiency Multiplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gradient">
                            <AnimateNumber
                                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                            >
                                {multiple}
                            </AnimateNumber>
                            x
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Faster than manual labor</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="glass-card overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-12 h-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Capacity Retained
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">
                            <AnimateNumber>{hoursSaved}</AnimateNumber>
                            <span className="text-lg ml-1 font-normal text-muted-foreground">hrs</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Found time this month</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="glass-card overflow-hidden relative border-primary/20 bg-primary/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                        <DollarSign className="w-12 h-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">
                            Value Generated
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            <span className="text-lg mr-1 font-normal">$</span>
                            <AnimateNumber>{moneySaved}</AnimateNumber>
                        </div>
                        <p className="text-xs text-primary/60 mt-1">Projected ROI verified</p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

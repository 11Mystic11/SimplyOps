"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  CreditCard,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  type: string;
  description: string | null;
  budget: number | null;
  status: string;
  endDate: string | null;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  vendor: string | null;
  passThroughPolicy: string;
  markupPercent: number;
  project: { id: string; name: string } | null;
}

interface BillablesListProps {
  clientId: string;
  selectedProjectIds: string[];
  selectedExpenseIds: string[];
  onProjectsChange: (ids: string[], projects: Project[]) => void;
  onExpensesChange: (ids: string[], expenses: Expense[]) => void;
}

export default function BillablesList({
  clientId,
  selectedProjectIds,
  selectedExpenseIds,
  onProjectsChange,
  onExpensesChange,
}: BillablesListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/clients/${clientId}/billables`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setExpenses(data.expenses || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load billable items");
        setLoading(false);
      });
  }, [clientId]);

  const toggleProject = (id: string) => {
    const next = selectedProjectIds.includes(id)
      ? selectedProjectIds.filter((p) => p !== id)
      : [...selectedProjectIds, id];
    onProjectsChange(
      next,
      projects.filter((p) => next.includes(p.id))
    );
  };

  const toggleExpense = (id: string) => {
    const next = selectedExpenseIds.includes(id)
      ? selectedExpenseIds.filter((e) => e !== id)
      : [...selectedExpenseIds, id];
    onExpensesChange(
      next,
      expenses.filter((e) => next.includes(e.id))
    );
  };

  const selectAll = () => {
    onProjectsChange(
      projects.map((p) => p.id),
      projects
    );
    onExpensesChange(
      expenses.map((e) => e.id),
      expenses
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading billable items...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  const totalItems = projects.length + expenses.length;
  const selectedCount =
    selectedProjectIds.length + selectedExpenseIds.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Unbilled Items
            </CardTitle>
            <CardDescription>
              {selectedCount} of {totalItems} items selected
            </CardDescription>
          </div>
          {totalItems > 0 && (
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Projects */}
        {projects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Completed Projects
            </h4>
            {projects.map((project) => {
              const isSelected = selectedProjectIds.includes(project.id);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {project.type}
                        </Badge>
                        {project.budget && (
                          <span className="text-xs text-muted-foreground">
                            Budget: ${project.budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Expenses */}
        {expenses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Unbilled Expenses
            </h4>
            {expenses.map((expense) => {
              const isSelected = selectedExpenseIds.includes(expense.id);
              return (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => toggleExpense(expense.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {expense.description}
                        </p>
                        <span className="text-sm font-medium">
                          ${expense.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {expense.category}
                        </Badge>
                        {expense.vendor && (
                          <span className="text-xs text-muted-foreground">
                            {expense.vendor}
                          </span>
                        )}
                        {expense.project && (
                          <span className="text-xs text-muted-foreground">
                            {expense.project.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {totalItems === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No unbilled items found for this client.</p>
            <p className="text-xs mt-1">
              Complete projects or add expenses first.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

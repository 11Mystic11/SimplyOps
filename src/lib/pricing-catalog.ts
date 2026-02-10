// ============================================================
// Simply Automations — Pricing Catalog (Single Source of Truth)
// Keep this file in sync with the public site's copy.
// ============================================================

export interface PlanTier {
  label: string;
  fee: number;
}

export interface Plan {
  id: string;
  name: string;
  setupFee: number | null;
  monthlyFee: number | null;
  setupTiers?: PlanTier[];
  monthlyTiers?: PlanTier[];
  supportMinutes: number;
  popular: boolean;
  outcomes: string;
  includes: string[];
}

export interface AddonTier {
  label: string;
  fee: number;
  desc: string;
}

export interface Addon {
  id: string;
  name: string;
  setupFee?: number;
  setupTiers?: AddonTier[];
  monthlyFee?: number;
  monthlyTiers?: AddonTier[];
  oneTimeTiers?: AddonTier[];
  hourlyRate?: number;
  monthlyBundle?: { hours: number; fee: number };
}

// ── Core Plans ──────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: "foundation",
    name: "Foundation System",
    setupFee: 3500,
    monthlyFee: 197,
    supportMinutes: 60,
    popular: false,
    outcomes: "Capture every lead, route instantly, book automatically.",
    includes: [
      "Missed-call capture",
      "Instant lead routing",
      "Basic CRM / pipeline",
      "Calendar booking & reminders",
      "Basic reporting",
    ],
  },
  {
    id: "momentum",
    name: "Momentum System",
    setupFee: 6500,
    monthlyFee: 297,
    supportMinutes: 120,
    popular: true,
    outcomes: "Nurture leads on autopilot and close more deals.",
    includes: [
      "Everything in Foundation",
      "Smart nurturing (SMS / email)",
      "Tagging & source tracking",
      "Staff assignment rules",
      "Hot lead escalation",
      "Monthly optimization",
    ],
  },
  {
    id: "command",
    name: "Command System",
    setupFee: null,
    monthlyFee: null,
    setupTiers: [
      { label: "Standard", fee: 9500 },
      { label: "Advanced", fee: 11000 },
      { label: "Enterprise", fee: 12500 },
    ],
    monthlyTiers: [
      { label: "Standard", fee: 497 },
      { label: "Advanced", fee: 647 },
      { label: "Enterprise", fee: 797 },
    ],
    supportMinutes: 240,
    popular: false,
    outcomes: "Full operational command center with strategic planning.",
    includes: [
      "Everything in Momentum",
      "Multi-workflow ops automations",
      "Advanced dashboards",
      "Quarterly roadmap planning",
    ],
  },
];

// ── Add-Ons ─────────────────────────────────────────────────

export const ADDONS: Addon[] = [
  {
    id: "ai-voice",
    name: "AI Voice Receptionist",
    setupFee: 2500,
    monthlyTiers: [
      { label: "Low", fee: 250, desc: "Up to 100 calls/mo" },
      { label: "Med", fee: 450, desc: "Up to 500 calls/mo" },
      { label: "High", fee: 650, desc: "Unlimited calls" },
    ],
  },
  {
    id: "billing-automation",
    name: "Billing Automation",
    setupFee: 1500,
    monthlyTiers: [
      { label: "Low", fee: 99, desc: "Basic invoicing" },
      { label: "Med", fee: 149, desc: "+ Payment reminders" },
      { label: "High", fee: 199, desc: "+ Advanced reporting" },
    ],
  },
  {
    id: "managed-website",
    name: "Managed Website Build",
    setupTiers: [
      { label: "Low", fee: 5500, desc: "5-page site" },
      { label: "Med", fee: 7500, desc: "10-page + blog" },
      { label: "High", fee: 9500, desc: "Full custom site" },
    ],
    monthlyTiers: [
      { label: "Low", fee: 197, desc: "Hosting + minor edits" },
      { label: "Med", fee: 297, desc: "+ Monthly updates" },
      { label: "High", fee: 397, desc: "+ SEO & content" },
    ],
  },
  {
    id: "crm-migration",
    name: "CRM Migration / Rebuild",
    oneTimeTiers: [
      { label: "Low", fee: 2000, desc: "Simple migration" },
      { label: "Med", fee: 4000, desc: "Complex migration" },
      { label: "High", fee: 6000, desc: "Full rebuild" },
    ],
  },
  {
    id: "extra-support",
    name: "Extra Support Hours",
    hourlyRate: 125,
    monthlyBundle: { hours: 3, fee: 300 },
  },
];

// ── Discounts ───────────────────────────────────────────────

export const DISCOUNTS = {
  prepaySetupPercent: 5,
  annualPrepayPercent: 10,
};

// ── Task templates per plan (used by dashboard lead ingest) ─

export const PLAN_TASKS: Record<string, string[]> = {
  foundation: [
    "Setup CRM & pipeline",
    "Configure lead routing",
    "Setup calendar booking & reminders",
    "Configure basic reporting",
    "Launch & QA",
  ],
  momentum: [
    "Setup CRM & pipeline",
    "Configure lead routing",
    "Setup calendar booking & reminders",
    "Configure basic reporting",
    "Setup SMS/email nurturing sequences",
    "Configure tagging & source tracking",
    "Setup staff assignment rules",
    "Configure hot lead escalation",
    "Monthly optimization kickoff",
    "Launch & QA",
  ],
  command: [
    "Setup CRM & pipeline",
    "Configure lead routing",
    "Setup calendar booking & reminders",
    "Configure basic reporting",
    "Setup SMS/email nurturing sequences",
    "Configure tagging & source tracking",
    "Setup staff assignment rules",
    "Configure hot lead escalation",
    "Setup multi-workflow ops automations",
    "Build advanced dashboards",
    "Quarterly roadmap planning session",
    "Monthly optimization kickoff",
    "Launch & QA",
  ],
};

// ── Helpers ─────────────────────────────────────────────────

/** Look up plan pricing by plan name (fuzzy match). Returns null if not found. */
export function getPlanPricing(
  planName: string
): { plan: Plan; setupFee: number; monthlyFee: number } | null {
  const lower = planName.toLowerCase();
  const plan = PLANS.find(
    (p) =>
      lower.includes(p.id) || lower.includes(p.name.toLowerCase())
  );
  if (!plan) return null;

  const setupFee =
    plan.setupFee ?? plan.setupTiers?.[0]?.fee ?? 0;
  const monthlyFee =
    plan.monthlyFee ?? plan.monthlyTiers?.[0]?.fee ?? 0;

  return { plan, setupFee, monthlyFee };
}

/** Look up add-on pricing by addon name (fuzzy match). */
export function getAddonPricing(
  addonName: string
): Addon | null {
  const lower = addonName.toLowerCase();
  return (
    ADDONS.find(
      (a) =>
        lower.includes(a.id) || lower.includes(a.name.toLowerCase())
    ) ?? null
  );
}

/** Format USD amount (dollar input) */
export function formatUSD(dollars: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

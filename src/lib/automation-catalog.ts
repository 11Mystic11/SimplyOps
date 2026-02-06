export interface AutomationProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  targetVerticals: string[];
  pricingRange: string;
  difficulty: string;
  upsells: string[];
}

export const AUTOMATION_CATALOG: AutomationProduct[] = [
  {
    id: "lead-surge-router",
    name: "Lead Surge Router",
    category: "Lead & Sales",
    description:
      "Unified intake for portal/web leads, dedupes, routes, and auto-notifies reps via SMS/voice.",
    targetVerticals: [
      "Car dealerships",
      "Real estate teams",
      "Agencies",
      "B2B services",
    ],
    pricingRange: "$800–1,500/mo",
    difficulty: "Medium",
    upsells: ["Agent scorecards", "AI autoresponder", "Call whisper tracking"],
  },
  {
    id: "recall-maximizer",
    name: "Recall Maximizer",
    category: "Lead & Sales",
    description:
      "Multi-channel reminder engine for dental/service plans to fill the calendar automatically.",
    targetVerticals: ["Dental offices", "Medical clinics", "HVAC/plumbers"],
    pricingRange: "$1,000–2,000/mo",
    difficulty: "Medium",
    upsells: ["Missed-call capture", "Prepaid clubs"],
  },
  {
    id: "after-hours-saver",
    name: "After-Hours Saver",
    category: "Lead & Sales",
    description:
      "AI receptionist + IVR to answer, qualify, and book urgent jobs overnight.",
    targetVerticals: ["HVAC/plumbers", "Electricians", "Home services"],
    pricingRange: "$1,500–3,000/mo",
    difficulty: "High",
    upsells: ["Deposit capture", "Bilingual routing"],
  },
  {
    id: "warranty-desk-automator",
    name: "Warranty Desk Automator",
    category: "Operations",
    description:
      "OCR + workflow to push warranty claims into OEM portals and track statuses.",
    targetVerticals: ["Car dealerships", "Manufacturing"],
    pricingRange: "$1,200–2,000/mo",
    difficulty: "High",
    upsells: ["Gross margin dashboards"],
  },
  {
    id: "maintenance-contract-guardian",
    name: "Maintenance Contract Guardian",
    category: "Operations",
    description:
      "Tracks agreements, triggers renewals, automates invoicing for service contracts.",
    targetVerticals: ["HVAC/plumbers", "Electricians", "Home services"],
    pricingRange: "$900–1,400/mo",
    difficulty: "Medium",
    upsells: ["Field tech upsell prompts", "Financing integration"],
  },
  {
    id: "referral-intake-sync",
    name: "Referral Intake Sync",
    category: "Operations",
    description:
      "Digitizes medical referrals from fax/email straight into EMR with alerts.",
    targetVerticals: ["Medical clinics", "Dental offices", "Healthcare"],
    pricingRange: "$2,000–4,000/mo",
    difficulty: "High",
    upsells: ["Analytics", "Prior-auth tracker"],
  },
  {
    id: "compliance-doc-tracker",
    name: "Compliance Doc Tracker",
    category: "Operations",
    description:
      "Monitors real estate/construction checklists and nudges stakeholders.",
    targetVerticals: [
      "Real estate teams",
      "Construction SMB",
      "Property managers",
    ],
    pricingRange: "$600–900/mo",
    difficulty: "Low",
    upsells: ["Broker/lender portals"],
  },
  {
    id: "smart-invoice-chaser",
    name: "Smart Invoice Chaser",
    category: "Finance",
    description:
      "Syncs accounting data to segmented reminder cadences with reporting.",
    targetVerticals: [
      "Agencies",
      "B2B services",
      "Professional services",
      "Any business",
    ],
    pricingRange: "$500–800/mo",
    difficulty: "Low",
    upsells: ["Cash flow forecasting"],
  },
  {
    id: "rent-risk-monitor",
    name: "Rent Risk Monitor",
    category: "Finance",
    description:
      "Combines bank feeds & PMS to escalate delinquencies with scripted comms.",
    targetVerticals: ["Property managers", "Real estate teams"],
    pricingRange: "$1,000–1,800/mo",
    difficulty: "Medium",
    upsells: ["Payment plans", "Resident portal widgets"],
  },
  {
    id: "churn-sentinel",
    name: "Churn Sentinel",
    category: "Retention",
    description:
      "Watches usage + billing signals to trigger CS plays before churn.",
    targetVerticals: ["SaaS startups", "B2B services", "Agencies"],
    pricingRange: "$1,200–2,000/mo",
    difficulty: "Medium",
    upsells: ["AI CS playbooks"],
  },
  {
    id: "sponsorship-promise-keeper",
    name: "Sponsorship Promise Keeper",
    category: "Retention",
    description:
      "Tracks sponsorship deliverables and renewals for nonprofits/agencies.",
    targetVerticals: ["Nonprofits/events", "Agencies"],
    pricingRange: "$400–700/mo",
    difficulty: "Low",
    upsells: ["Partner portal", "ROI reporting"],
  },
  {
    id: "proposal-to-kickoff-bridge",
    name: "Proposal-to-Kickoff Bridge",
    category: "Internal Ops",
    description:
      "Turns signed contracts into projects, invoices, welcome kits automatically.",
    targetVerticals: ["B2B services", "Agencies", "Professional services"],
    pricingRange: "$700–1,100/mo",
    difficulty: "Low",
    upsells: ["Onboarding chatbot", "NPS workflow"],
  },
  {
    id: "kpi-command-center",
    name: "KPI Command Center",
    category: "Internal Ops",
    description:
      "Aggregates franchise/location metrics into a live command board.",
    targetVerticals: ["Franchise networks", "Multi-location businesses"],
    pricingRange: "$1,500–2,500/mo",
    difficulty: "Medium",
    upsells: ["Predictive alerts", "Benchmarking"],
  },
  {
    id: "carrier-fastlane",
    name: "Carrier Fastlane",
    category: "Internal Ops",
    description:
      "End-to-end logistics carrier onboarding pipeline with compliance tracking.",
    targetVerticals: ["Logistics brokers", "Supply chain"],
    pricingRange: "$2,000–3,500/mo",
    difficulty: "High",
    upsells: ["Carrier scoring", "Insurance monitoring"],
  },
  {
    id: "safety-pulse",
    name: "Safety Pulse",
    category: "Internal Ops",
    description:
      "Mobile inspections feeding OSHA logs and corrective action tracking.",
    targetVerticals: ["Construction SMB", "Manufacturing", "Facilities"],
    pricingRange: "$800–1,300/mo",
    difficulty: "Medium",
    upsells: ["AI photo analysis", "Training LMS"],
  },
];

export function getCatalogForPrompt(): string {
  return AUTOMATION_CATALOG.map(
    (p) =>
      `- **${p.name}** (${p.category}): ${p.description} Target: ${p.targetVerticals.join(", ")}. Pricing: ${p.pricingRange}. Upsells: ${p.upsells.join(", ")}.`,
  ).join("\n");
}

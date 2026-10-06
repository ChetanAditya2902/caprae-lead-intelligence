import { demoLeads } from "@/data/demo-leads";
import type { Lead } from "@/types/lead";

export function getDemoLeadById(id: string): Lead | undefined {
  return demoLeads.find((lead) => lead.id === id);
}

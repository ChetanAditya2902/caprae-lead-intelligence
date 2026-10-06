import { demoLeads } from "@/data/demo-leads";

export function GET() {
  return Response.json({ data: demoLeads, source: "demo" });
}

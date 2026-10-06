import { getDemoLeadById } from "@/lib/utils/leads";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/leads/[id]">,
) {
  const { id } = await params;
  const lead = getDemoLeadById(id);

  if (!lead) {
    return Response.json(
      { error: "Lead not found" },
      { status: 404 },
    );
  }

  return Response.json({ data: lead, source: "demo" });
}

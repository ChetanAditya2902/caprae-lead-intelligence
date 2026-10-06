import { prisma } from "@/lib/db/prisma";
import { leadRecordSelect, toLeadRecord } from "@/lib/leads/serialize";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/leads/[id]">,
) {
  const { id } = await params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: leadRecordSelect,
    });
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }
    return Response.json({ data: toLeadRecord(lead) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load lead:", error);
    return Response.json(
      { error: "Unable to load lead. Check the database connection and try again." },
      { status: 503 },
    );
  }
}

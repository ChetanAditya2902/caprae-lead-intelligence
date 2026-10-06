import { notFound } from "next/navigation";
import LeadDetail from "@/components/leads/lead-detail";
import { prisma } from "@/lib/db/prisma";
import { scoreLead } from "@/lib/scoring";

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  const score = scoreLead(lead);

  return (
    <LeadDetail
      lead={{
        id: lead.id,
        companyName: lead.companyName,
        website: lead.website,
        domain: lead.domain,
        industry: lead.industry,
        subIndustry: lead.subIndustry,
        employeeCount: lead.employeeCount,
        revenue: lead.revenue?.toString() ?? null,
        revenueCurrency: lead.revenueCurrency?.trim() ?? null,
        location: lead.location,
        country: lead.country,
        technologies: lead.technologies,
        hiringSignal: lead.hiringSignal,
        growthSignal: lead.growthSignal,
        fundingSignal: lead.fundingSignal,
        contactName: lead.contactName,
        contactTitle: lead.contactTitle,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        linkedinUrl: lead.linkedinUrl,
        emailVerified: lead.emailVerified,
        phoneVerified: lead.phoneVerified,
        dataSource: lead.dataSource,
        lastUpdated: lead.lastUpdated.toISOString(),
        aiSummary: lead.aiSummary,
        aiWhyAttractive: lead.aiWhyAttractive,
        aiStrongestSignals: lead.aiStrongestSignals,
        aiRisks: lead.aiRisks,
        aiOutreachAngle: lead.aiOutreachAngle,
        aiNextAction: lead.aiNextAction,
        aiGeneratedAt: lead.aiGeneratedAt?.toISOString() ?? null,
      }}
      score={score}
    />
  );
}

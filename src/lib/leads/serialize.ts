import type { Prisma } from "@/generated/prisma/client";
import type { LeadRecord } from "@/types/lead-record";

export const leadRecordSelect = {
  id: true,
  companyName: true,
  website: true,
  domain: true,
  industry: true,
  subIndustry: true,
  employeeCount: true,
  revenue: true,
  revenueCurrency: true,
  location: true,
  country: true,
  technologies: true,
  hiringSignal: true,
  growthSignal: true,
  fundingSignal: true,
  contactName: true,
  contactTitle: true,
  contactEmail: true,
  emailVerified: true,
  phoneVerified: true,
  opportunityScore: true,
  scoreTier: true,
  scoreReasons: true,
} satisfies Prisma.LeadSelect;

type LeadRecordSource = Prisma.LeadGetPayload<{
  select: typeof leadRecordSelect;
}>;

export function toLeadRecord(lead: LeadRecordSource): LeadRecord {
  const topSignal =
    lead.hiringSignal
      ? `Hiring: ${lead.hiringSignal}`
      : lead.growthSignal
        ? `Growth: ${lead.growthSignal}`
        : lead.fundingSignal
          ? `Funding: ${lead.fundingSignal}`
          : lead.technologies.length > 0
            ? `Tech: ${lead.technologies.slice(0, 2).join(", ")}`
            : "Low data completeness";

  const contactStatus = !lead.contactEmail
    ? lead.contactName
      ? "Contact only"
      : "Missing contact"
    : lead.emailVerified
      ? "Verified email"
      : "Email available";

  return {
    id: lead.id,
    companyName: lead.companyName,
    website: lead.website,
    domain: lead.domain,
    industry: lead.industry,
    subIndustry: lead.subIndustry,
    employeeCount: lead.employeeCount,
    revenue: lead.revenue?.toString() ?? null,
    revenueCurrency: lead.revenueCurrency,
    location: lead.location,
    country: lead.country,
    technologies: lead.technologies,
    hiringSignal: lead.hiringSignal,
    growthSignal: lead.growthSignal,
    fundingSignal: lead.fundingSignal,
    contactName: lead.contactName,
    contactTitle: lead.contactTitle,
    contactEmail: lead.contactEmail,
    emailVerified: lead.emailVerified,
    phoneVerified: lead.phoneVerified,
    opportunityScore: lead.opportunityScore,
    scoreTier: lead.scoreTier,
    scoreReasons: lead.scoreReasons,
    topSignal: topSignal.slice(0, 88),
    contactStatus,
  };
}

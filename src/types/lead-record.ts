import type { ScoreTier } from "@/generated/prisma/enums";

export type LeadRecord = {
  id: string;
  companyName: string;
  website: string | null;
  domain: string | null;
  industry: string | null;
  subIndustry: string | null;
  employeeCount: number | null;
  revenue: string | null;
  revenueCurrency: string | null;
  location: string | null;
  country: string | null;
  technologies: string[];
  hiringSignal: string | null;
  growthSignal: string | null;
  fundingSignal: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  opportunityScore: number | null;
  scoreTier: ScoreTier | null;
  scoreReasons: string[];
  topSignal: string;
  contactStatus: string;
};

export type LeadListResponse = {
  data: LeadRecord[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    averageScore: number;
  };
  filters: {
    industries: string[];
    locations: string[];
  };
};

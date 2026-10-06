import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, ScoreTier } from "../src/generated/prisma/client";

const companyNames = [
  "Northstar Robotics",
  "Vertex Industrial Systems",
  "BluePeak Analytics",
  "Atlas Renewable Technologies",
  "Summit Logistics Group",
  "Pioneer Health Systems",
  "ClearPath Manufacturing",
  "Orion Fleet Technologies",
  "Juniper Ridge Software",
  "Copperleaf Energy Systems",
  "Clearwater Operations",
  "Pinehaven Learning Labs",
  "Redwood Process Automation",
  "Summitline Networks",
  "Westward Clinical Tools",
  "Evergreen Supply Systems",
  "Cloudberry Financial Tech",
  "Maplecrest Mobility",
  "Stonebridge Care Platform",
  "Windward Manufacturing",
  "Goldenhour Workspaces",
  "Foxglove Data Services",
  "Ironwood Fleet Systems",
  "Lakeshore Commerce Tools",
  "Daybreak Identity Labs",
  "Openfield Health Software",
  "Beaconhill Logistics",
  "Rainshadow Energy",
  "Parkside Revenue Tools",
  "Greyrock Learning Systems",
  "Willowbend Automation",
  "Moonstone Research Cloud",
  "Eastgate Security Works",
  "Seabright Customer Systems",
  "Canyonpath Imaging",
  "Fieldstone Payment Tools",
  "Morningside Network Labs",
  "Aspenloop Resource Systems",
  "Starling Data Exchange",
  "Redcliff Quality Software",
  "Holloway Operations Tech",
  "Bluewater Compliance Tools",
  "Silveroak Procurement",
  "Cloudfield Service Group",
  "Greystone Product Labs",
  "Windmill Signal Systems",
];

const industries = [
  ["Healthcare technology", "Clinical operations"],
  ["Data & analytics", "Business intelligence"],
  ["Cloud infrastructure", "Developer platforms"],
  ["Industrial automation", "Robotics"],
  ["Financial services", "Payments"],
  ["Education technology", "Workforce learning"],
  ["Cybersecurity", "Identity management"],
  ["Logistics", "Supply chain software"],
];

const locations: Array<[string, string]> = [
  ["Austin, TX", "US"],
  ["Toronto, ON", "CA"],
  ["London", "GB"],
  ["Denver, CO", "US"],
  ["Berlin", "DE"],
  ["Boston, MA", "US"],
  ["Vancouver, BC", "CA"],
  ["Chicago, IL", "US"],
  ["Manchester", "GB"],
  ["Seattle, WA", "US"],
  ["Munich", "DE"],
  ["New York, NY", "US"],
];

const technologySets = [
  ["AWS", "Snowflake", "HubSpot"],
  ["Azure", "Databricks", "Salesforce"],
  ["Google Cloud", "Kubernetes", "Segment"],
  ["AWS", "PostgreSQL", "Workday"],
  ["Azure", "Power BI", "HubSpot"],
  ["Google Cloud", "dbt", "Salesforce"],
  ["AWS", "Okta", "Snowflake"],
  ["Azure", "Kubernetes", "Tableau"],
];

const employeeCounts = [
  820, 460, 235, 690, 180, 1200, 340, 150, 950, 74, 530, 280,
  1600, 210, 420, 105, 760, 305, 88, 1400, 195, 625, 370, 115,
];

const annualRevenues = [
  "185000000.00", "74000000.00", "38500000.00", "132000000.00",
  "22000000.00", "245000000.00", "57000000.00", "16500000.00",
  "198000000.00", "8200000.00", "91000000.00", "33000000.00",
  "310000000.00", "26500000.00", "118000000.00", "12500000.00",
  "156000000.00", "47000000.00", "6800000.00", "280000000.00",
  "19500000.00", "105000000.00", "63500000.00", "14200000.00",
];

const scoreValues = [
  96, 93, 91, 89, 87, 85, 84, 82, 81, 80,
  79, 77, 76, 74, 72, 70, 68, 67, 65, 64,
  62, 60, 58, 57, 55, 53, 51, 49, 47, 45,
  43, 41, 39, 37, 35, 33, 31, 29, 27, 25,
  23, 21,
];

function getScoreTier(index: number): ScoreTier | null {
  if (index < 10) return ScoreTier.HIGH;
  if (index < 22) return ScoreTier.MEDIUM;
  if (index < 42 || index >= 46) return ScoreTier.LOW;
  return null;
}

function getReasons(index: number, tier: ScoreTier | null): string[] {
  if (tier === null) return [];
  if (index >= 46) {
    return ["Duplicate-like domain; review record quality before prioritizing."];
  }

  const reasons: string[] = [];
  if (index < 10) {
    reasons.push("Strong company size and industry alignment.");
  } else if (index < 25) {
    reasons.push("Moderate company size and industry alignment.");
  } else {
    reasons.push("Limited or unconfirmed fit signals.");
  }
  if (index % 3 !== 0) reasons.push("Recent hiring or growth activity is reported.");
  if (index % 4 === 0) reasons.push("Relevant technology signals are present.");
  if (index % 5 === 0) reasons.push("Some contact or company data may need verification.");
  return reasons;
}

function buildSeedRecords() {
  return Array.from({ length: 48 }, (_, index) => {
    const duplicate = index >= 46;
    const sourceIndex = duplicate ? 4 : index;
    const companyName = companyNames[sourceIndex];
    const domain = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".example";
    const industry = industries[sourceIndex % industries.length];
    const location = locations[sourceIndex % locations.length];
    const tier = getScoreTier(index);
    const incomplete = index >= 42 && index < 46;
    const contactAvailable = !incomplete && index % 7 !== 0;
    const emailAvailable = contactAvailable && index % 6 !== 0;
    const phoneAvailable = contactAvailable && index % 5 !== 0;
    const nameNumber = String(index + 1).padStart(3, "0");
    const syntheticPhone = `+1-202-555-${String(100 + index).padStart(4, "0")}`;
    const createdAt = new Date(Date.UTC(2025, 0, 1 + (index % 28)));
    const lastUpdated = new Date(Date.UTC(2026, index % 9, 1 + (index % 27)));

    return {
      id: `lead-${nameNumber}`,
      companyName,
      website: incomplete && index % 2 === 0 ? null : `https://${domain}`,
      domain: incomplete && index % 2 === 1 ? null : domain,
      industry: incomplete && index === 43 ? null : industry[0],
      subIndustry: incomplete && index === 44 ? null : industry[1],
      employeeCount: incomplete && index === 42 ? null : employeeCounts[sourceIndex % employeeCounts.length],
      revenue: incomplete && index === 45
        ? null
        : new Prisma.Decimal(annualRevenues[sourceIndex % annualRevenues.length]),
      revenueCurrency: incomplete && index === 45 ? null : "USD",
      location: incomplete && index === 43 ? null : location[0],
      country: incomplete && index === 43 ? null : location[1],
      technologies: incomplete && index === 44
        ? []
        : technologySets[sourceIndex % technologySets.length],
      hiringSignal: index % 3 === 0 ? null : `${3 + (index % 18)} open roles across product and commercial teams`,
      growthSignal: index % 4 === 0 ? null : ["New regional expansion", "Growing product portfolio", "Increasing customer adoption"][index % 3],
      fundingSignal: index % 5 === 0 ? null : ["Seed extension", "Series A", "Series B", "Growth round"][index % 4],
      contactName: contactAvailable ? `Synthetic Contact ${nameNumber}` : null,
      contactTitle: contactAvailable
        ? ["VP of Operations", "Head of Growth", "Chief Technology Officer", "Director of Partnerships"][index % 4]
        : null,
      contactEmail: emailAvailable ? `contact${nameNumber}@${domain}` : null,
      contactPhone: phoneAvailable ? syntheticPhone : null,
      linkedinUrl: contactAvailable ? `https://www.linkedin.example/company/${domain.replace(".example", "")}` : null,
      emailVerified: emailAvailable && index % 4 === 0,
      phoneVerified: phoneAvailable && index % 3 === 0,
      dataSource: duplicate ? "synthetic-duplicate-test" : "synthetic-challenge-seed",
      lastUpdated,
      opportunityScore: tier === null ? null : duplicate ? 42 + (index - 46) * 4 : scoreValues[index],
      scoreTier: tier,
      scoreReasons: getReasons(index, tier),
      aiSummary: null,
      aiOutreachAngle: null,
      aiRisks: [],
      aiNextAction: null,
      aiGeneratedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before seeding the database.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    for (const record of buildSeedRecords()) {
      await prisma.lead.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.info("Seeded 48 synthetic SaaSquatch lead records.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to seed the database:", error);
  process.exitCode = 1;
});

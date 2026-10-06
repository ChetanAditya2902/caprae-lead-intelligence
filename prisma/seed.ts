import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { scoreLead } from "../src/lib/scoring";

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

const generatedBrands = [
  "Asterfield",
  "Novaforge",
  "Lumenway",
  "Ironvale",
  "Crestwave",
  "Oakspire",
  "Brightforge",
  "Vantage Harbor",
  "Everpath",
  "Solstice Ridge",
  "Emberline",
  "Granitewell",
  "Mosaic Harbor",
  "Silverpath",
  "Pinecrest",
  "Redstone Valley",
  "Cloudcrest",
  "Noblefield",
  "Springwell",
  "Cobalt Ridge",
  "Northwind",
  "Greenstone",
  "Harborstone",
  "Summit Grove",
  "Lakefront",
  "Westlake",
  "Crownfield",
  "Brightwater",
  "Ridgepoint",
  "Amberfield",
  "Stonewell",
  "Suncrest",
  "Longview",
  "Meadowbrook",
  "Oakmont",
  "Silvercrest",
  "Maplebridge",
  "Highland",
  "Cedarfield",
  "Fairview",
  "Brookstone",
  "Grandview",
  "Redfern",
  "Southridge",
];

const companySuffixes = [
  "Systems",
  "Analytics",
  "Technologies",
  "Software",
  "Networks",
  "Platforms",
  "Industries",
  "Solutions",
  "Digital",
  "Innovations",
  "Labs",
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
  ["Renewable energy", "Grid management"],
  ["Manufacturing", "Quality management"],
  ["Fleet technology", "Transportation"],
  ["Enterprise software", "Revenue operations"],
  ["Agriculture technology", "Precision farming"],
  ["Real estate technology", "Property operations"],
  ["Telecommunications", "Network operations"],
  ["Climate technology", "Carbon accounting"],
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
  ["Portland, OR", "US"],
  ["Atlanta, GA", "US"],
  ["San Diego, CA", "US"],
  ["Montreal, QC", "CA"],
  ["Edinburgh", "GB"],
  ["Amsterdam", "NL"],
  ["Dublin", "IE"],
  ["Stockholm", "SE"],
  ["Paris", "FR"],
  ["Zurich", "CH"],
  ["Melbourne", "AU"],
  ["Singapore", "SG"],
  ["Raleigh, NC", "US"],
  ["Phoenix, AZ", "US"],
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

const seedRecordCount = 500;
const duplicateStartIndex = seedRecordCount - 2;
const incompleteStartIndex = 475;

function getCompanyName(index: number): string {
  if (index < companyNames.length) return companyNames[index];

  const generatedIndex = index - companyNames.length;
  const brand = generatedBrands[Math.floor(generatedIndex / companySuffixes.length)];
  const suffix = companySuffixes[generatedIndex % companySuffixes.length];
  if (!brand || !suffix) {
    throw new Error(`Unable to generate a synthetic company name for record ${index + 1}.`);
  }
  return `${brand} ${suffix}`;
}

function buildSeedRecords() {
  return Array.from({ length: seedRecordCount }, (_, index) => {
    const duplicate = index >= duplicateStartIndex;
    const sourceIndex = duplicate ? 4 : index;
    const companyName = getCompanyName(sourceIndex);
    const domain = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".example";
    const industry = industries[sourceIndex % industries.length];
    const location = locations[sourceIndex % locations.length];
    const incomplete = index >= incompleteStartIndex && index < duplicateStartIndex;
    const employeeCount = incomplete && index === incompleteStartIndex
      ? null
      : employeeCounts[sourceIndex % employeeCounts.length];
    const contactAvailable = !incomplete && index % 7 !== 0;
    const emailAvailable = contactAvailable && index % 6 !== 0;
    const phoneAvailable = contactAvailable && index % 5 !== 0;
    const nameNumber = String(index + 1).padStart(3, "0");
    const syntheticPhone = `+1-202-555-01${String(index % 100).padStart(2, "0")}`;
    const createdAt = new Date(Date.UTC(2025, 0, 1 + (index % 28)));
    const lastUpdated = new Date(Date.UTC(2026, index % 9, 1 + (index % 27)));

    const record = {
      id: `lead-${nameNumber}`,
      companyName,
      website: incomplete && index % 2 === 0 ? null : `https://${domain}`,
      domain: incomplete && index % 2 === 1 ? null : domain,
      industry: incomplete && index % 4 === 1 ? null : industry[0],
      subIndustry: incomplete && index % 4 === 2 ? null : industry[1],
      employeeCount,
      revenue: incomplete && index === incompleteStartIndex + 3
        ? null
        : employeeCount === null
          ? null
          : new Prisma.Decimal(
              (employeeCount * (100_000 + (index % 9) * 25_000)).toFixed(2),
            ),
      revenueCurrency: incomplete && index === incompleteStartIndex + 3
        ? null
        : "USD",
      location: incomplete && index % 4 === 1 ? null : location[0],
      country: incomplete && index % 4 === 1 ? null : location[1],
      technologies: incomplete && index % 4 === 2
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
      aiSummary: null,
      aiOutreachAngle: null,
      aiRisks: [],
      aiNextAction: null,
      aiGeneratedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    const score = scoreLead(record);
    return {
      ...record,
      opportunityScore: score.totalScore,
      scoreTier: score.tier,
      scoreReasons: score.reasons,
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
    console.info(`Seeded ${seedRecordCount} synthetic SaaSquatch lead records.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to seed the database:", error);
  process.exitCode = 1;
});

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { scoreLead } from "../src/lib/scoring";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before rescoring leads.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const leads = await prisma.lead.findMany();
    const scoredLeads = leads.map((lead) => ({
      id: lead.id,
      score: scoreLead(lead),
    }));

    await prisma.$transaction(async (transaction) => {
      await transaction.leadScoreFactor.deleteMany();

      for (const { id, score } of scoredLeads) {
        await transaction.lead.update({
          where: { id },
          data: {
            opportunityScore: score.totalScore,
            scoreTier: score.tier,
            scoreReasons: score.reasons,
          },
        });
      }

      await transaction.leadScoreFactor.createMany({
        data: scoredLeads.flatMap(({ id, score }) =>
          score.factors.map((factor) => ({
            leadId: id,
            factor: factor.factor,
            points: factor.points,
            maxPoints: factor.maxPoints,
            reason: factor.reason,
            signal: factor.signal,
          })),
        ),
      });
    });

    console.info(`Recalculated scores and factors for ${leads.length} leads.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to recalculate lead scores:", error);
  process.exitCode = 1;
});

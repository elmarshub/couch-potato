import { PrismaClient, SeatTier } from "@prisma/client";

const prisma = new PrismaClient();

// Realistic small-cinema layout: seat count escalates from a small VIP
// recliner block at the back to the largest Standard block near the screen.
const ROWS: Array<{ row: string; count: number; tier: SeatTier }> = [
  { row: "A", count: 12, tier: SeatTier.STANDARD },
  { row: "B", count: 12, tier: SeatTier.STANDARD },
  { row: "C", count: 12, tier: SeatTier.STANDARD },
  { row: "D", count: 10, tier: SeatTier.STANDARD },
  { row: "E", count: 10, tier: SeatTier.PREMIUM },
  { row: "F", count: 10, tier: SeatTier.PREMIUM },
  { row: "G", count: 8, tier: SeatTier.PREMIUM },
  { row: "H", count: 4, tier: SeatTier.VIP },
];

async function main() {
  const seats = ROWS.flatMap(({ row, count, tier }) =>
    Array.from({ length: count }, (_, i) => ({
      row,
      number: i + 1,
      tier,
    }))
  );

  for (const seat of seats) {
    await prisma.seat.upsert({
      where: { row_number: { row: seat.row, number: seat.number } },
      update: { tier: seat.tier },
      create: seat,
    });
  }

  console.log(`Seeded ${seats.length} seats.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

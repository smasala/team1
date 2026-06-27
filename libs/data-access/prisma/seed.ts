/**
 * Prisma seed — populates the catalogue from scripts/baupreise-catalogue.json
 * and the Supabase test user.
 *
 * Pricing rule: a STRICT 30% markup is applied to every baseline price from the
 * catalogue. We persist BOTH the untouched baseline (`basePrice`) and the sell
 * price (`price = round(basePrice * 1.30, 2)`) so the markup stays auditable.
 *
 * Idempotent: the catalogue is wiped and rebuilt on each run, and the test user
 * is upserted, so this is safe to re-run after a crash (ROADMAP convention).
 *
 * Run:  npm run db:seed
 *       (= node --import @swc-node/register/esm-register libs/data-access/prisma/seed.ts)
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

// --- Constants ------------------------------------------------------------

/** Supabase Auth test user (already exists in auth.users). */
const TEST_USER_ID = '68e75f68-1ee2-46f4-9fee-2bbb2613a02d';

/** Strict markup applied to every baseline catalogue price. */
const MARKUP_PCT = 30;
const MARKUP_FACTOR = 1 + MARKUP_PCT / 100;

const CATALOGUE_PATH = resolve(
  process.cwd(),
  'scripts/baupreise-catalogue.json'
);

// --- Source JSON shape ----------------------------------------------------

interface CatalogueItem {
  subcategory: string | null;
  description: string;
  unit: string;
  unitRaw: string | null;
  price: number;
  priceRaw: string | null;
}

interface CatalogueCategory {
  slug: string;
  name: string;
  url: string | null;
  subcategories: string[];
  items: CatalogueItem[];
}

interface Catalogue {
  currency: string;
  categories: CatalogueCategory[];
}

// --- Helpers --------------------------------------------------------------

/** Round to 2 decimals (cents) the way money should be stored. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** baseline -> sell price with the strict markup. */
const applyMarkup = (basePrice: number): number =>
  round2(basePrice * MARKUP_FACTOR);

// --- Driver adapter (mirrors PrismaService) -------------------------------

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

// --- Seed routines --------------------------------------------------------

async function seedUser(): Promise<string> {
  // Ensure the test user belongs to a demo organisation, as its admin, so the
  // org-scoped APIs have a tenant to work against out of the box. The id is the
  // Supabase Auth UUID, so logging in via Supabase resolves to this very row.
  const existing = await prisma.user.findUnique({
    where: { id: TEST_USER_ID },
    select: { organisationId: true },
  });

  let organisationId = existing?.organisationId ?? null;
  if (!organisationId) {
    const org = await prisma.organisation.create({
      data: { name: 'FeldPro Demo' },
    });
    organisationId = org.id;
  }

  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: { organisationId, role: 'ADMIN' },
    create: {
      id: TEST_USER_ID,
      email: 'test@fieldpro.app',
      fullName: 'Test Tradesman',
      role: 'ADMIN',
      organisationId,
    },
  });
  console.log(`✓ test user ${TEST_USER_ID} (org ${organisationId}, ADMIN)`);
  return organisationId;
}

async function seedCatalogue(
  catalogue: Catalogue,
  organisationId: string,
): Promise<void> {
  // Wipe catalogue tables for a deterministic rebuild. Order respects FKs.
  await prisma.item.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();

  let categoryCount = 0;
  let subcategoryCount = 0;
  let itemCount = 0;

  for (const cat of catalogue.categories) {
    const category = await prisma.category.create({
      data: { slug: cat.slug, name: cat.name, sourceUrl: cat.url, organisationId },
    });
    categoryCount++;

    // Union of declared subcategories and any referenced by items, so every
    // item.subcategory resolves to a real row even if the source list misses it.
    const subNames = new Set<string>(cat.subcategories ?? []);
    for (const item of cat.items) {
      if (item.subcategory) subNames.add(item.subcategory);
    }

    if (subNames.size > 0) {
      await prisma.subcategory.createMany({
        data: [...subNames].map((name) => ({ name, categoryId: category.id })),
      });
    }
    const subs = await prisma.subcategory.findMany({
      where: { categoryId: category.id },
      select: { id: true, name: true },
    });
    subcategoryCount += subs.length;
    const subId = new Map(subs.map((s) => [s.name, s.id]));

    if (cat.items.length > 0) {
      await prisma.item.createMany({
        data: cat.items.map((item) => ({
          description: item.description,
          unit: item.unit,
          unitRaw: item.unitRaw,
          basePrice: item.price,
          price: applyMarkup(item.price),
          markupPct: MARKUP_PCT,
          priceRaw: item.priceRaw,
          currency: catalogue.currency ?? 'EUR',
          categoryId: category.id,
          subcategoryId: item.subcategory
            ? subId.get(item.subcategory) ?? null
            : null,
        })),
      });
      itemCount += cat.items.length;
    }
  }

  console.log(
    `✓ catalogue: ${categoryCount} categories, ${subcategoryCount} subcategories, ${itemCount} items (+${MARKUP_PCT}% markup)`
  );
}

// --- Entrypoint -----------------------------------------------------------

async function main(): Promise<void> {
  const catalogue = JSON.parse(
    readFileSync(CATALOGUE_PATH, 'utf-8')
  ) as Catalogue;

  console.log(`Seeding from ${CATALOGUE_PATH} …`);
  const organisationId = await seedUser();
  await seedCatalogue(catalogue, organisationId);
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

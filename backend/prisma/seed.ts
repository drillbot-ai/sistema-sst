import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Seed script to load dynamic form definitions into the database.
// It iterates over all JSON files in prisma/forms and upserts the
// corresponding Form and FormVersion records. If a form already
// exists, it inserts a new version; otherwise, it creates the form.

const prisma = new PrismaClient();

async function upsertForm(def: any) {
  const form = await prisma.form.upsert({
    where: { code: def.code },
    update: { name: def.name, description: def.description ?? undefined },
    create: { code: def.code, name: def.name, description: def.description ?? undefined },
  });
  // Determine target version number
  const versions = await prisma.formVersion.findMany({ where: { formId: form.id }, select: { version: true } });
  const desired = typeof def.version === 'number' ? def.version : undefined;
  const maxVersion = versions.length ? Math.max(...versions.map(v => v.version)) : 0;
  const targetVersion = desired ?? (maxVersion + 1 || 1);

  // Deactivate all existing versions first
  await prisma.formVersion.updateMany({ where: { formId: form.id }, data: { active: false } });

  // If a version with the same number exists, update it; otherwise create
  const existing = await prisma.formVersion.findUnique({ where: { formId_version: { formId: form.id, version: targetVersion } } });
  if (existing) {
    await prisma.formVersion.update({ where: { id: existing.id }, data: { schema: def, active: true } });
  } else {
    await prisma.formVersion.create({ data: { formId: form.id, version: targetVersion, schema: def, active: true } });
  }
  console.log(`Seeded ${def.code} v${targetVersion}`);
}

async function main() {
  const formsDir = path.join(__dirname, 'forms');
  const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const contents = fs.readFileSync(path.join(formsDir, file), 'utf-8');
    const def = JSON.parse(contents);
    await upsertForm(def);
  }
}

main().catch((err) => console.error(err)).finally(() => prisma.$disconnect());
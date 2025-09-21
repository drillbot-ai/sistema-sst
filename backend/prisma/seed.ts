// Minimal seed (no-op)import { PrismaClient } from '@prisma/client';

async function main() {import fs from 'fs';

  // Add initial data if neededimport path from 'path';

}

const prisma = new PrismaClient();

main().catch((e) => {

  console.error(e);async function upsertForm(jsonFile: string) {

  process.exit(1);  const raw = fs.readFileSync(jsonFile, 'utf-8');

});  const def = JSON.parse(raw);

  const form = await prisma.form.upsert({
    where: { code: def.code },
    update: { name: def.name, description: def.description ?? undefined },
    create: { code: def.code, name: def.name, description: def.description ?? undefined }
  });
  await prisma.formVersion.create({
    data: {
      formId: form.id,
      version: def.version ?? 1,
      schema: def,
      active: true
    }
  });
  console.log(`Seeded ${def.code}`);
}

async function main() {
  const dir = path.join(__dirname, '..', 'seeds', 'forms');
  const files = ['go-fo-09.json', 'go-fo-07.json', 'go-fo-01.json'];
  for (const f of files) await upsertForm(path.join(dir, f));
}

main().catch(console.error).finally(()=>prisma.$disconnect());

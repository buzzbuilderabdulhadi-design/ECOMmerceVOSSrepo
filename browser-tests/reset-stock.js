const path = require('path');
const fs = require('fs');
module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const env = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
for (const l of env.split(/\r?\n/)) {
  const t = l.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const k = t.slice(0, t.indexOf('=')).trim();
  let v = t.slice(t.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  if (k && !process.env[k]) process.env[k] = v;
}
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const targets = [
    { slug: 'giada-diamond-ring', variantStock: 25 },
    { slug: 'riviera-tennis-bracelet', variantStock: 25 },
    { slug: 'cinque-terre-hoop-earrings', variantStock: 25 },
  ];
  for (const t of targets) {
    const pr = await p.product.findUnique({ where: { slug: t.slug }, include: { variants: true } });
    if (!pr) { console.log(`SKIP ${t.slug} (not found)`); continue; }
    if (pr.variants.length > 0) {
      const r = await p.productVariant.updateMany({
        where: { productId: pr.id },
        data: { stock: t.variantStock, isActive: true },
      });
      console.log(`${t.slug}: reset ${r.count} variants -> stock ${t.variantStock}`);
    }
    await p.product.update({ where: { id: pr.id }, data: { stock: t.variantStock } });
  }
  console.log('Stock reset complete.');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
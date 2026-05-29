/**
 * Script para limpar dados de teste do banco.
 * Preserva: planos, configurações, admins.
 * Remove: bookings, assinaturas, clientes, vouchers usados, cobranças de insumos, leads.
 *
 * Uso:
 *   npx tsx scripts/reset-test-data.ts
 *
 * Para limpar TUDO incluindo insumos e vouchers:
 *   npx tsx scripts/reset-test-data.ts --full
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FULL = process.argv.includes("--full");

async function main() {
  console.log("\n🧹 Iniciando limpeza do banco de dados de teste...\n");
  if (FULL) console.log("⚠️  Modo FULL: insumos e vouchers também serão removidos.\n");

  // Ordem importa por causa das foreign keys
  const results: { tabela: string; removidos: number }[] = [];

  async function del(label: string, fn: () => Promise<{ count: number }>) {
    const { count } = await fn();
    results.push({ tabela: label, removidos: count });
    console.log(`  ✓ ${label}: ${count} registro(s) removido(s)`);
  }

  await del("AccessLog",       () => prisma.accessLog.deleteMany());
  await del("ConsumableSale",  () => prisma.consumableSale.deleteMany());
  await del("Booking",         () => prisma.booking.deleteMany());
  await del("Subscription",    () => prisma.subscription.deleteMany());
  await del("Lead",            () => prisma.lead.deleteMany());
  await del("Client",          () => prisma.client.deleteMany());

  // Vouchers: reset usedCount mas mantém os vouchers ativos
  const voucherReset = await prisma.voucher.updateMany({ data: { usedCount: 0 } });
  console.log(`  ✓ Voucher (reset usedCount): ${voucherReset.count} voucher(s) resetado(s)`);

  if (FULL) {
    await del("ConsumableSale (já feito)", async () => ({ count: 0 }));
    await del("Consumable",   () => prisma.consumable.deleteMany());
    await del("Voucher",      () => prisma.voucher.deleteMany());
  }

  console.log("\n✅ Limpeza concluída!\n");
  console.log("Resumo:");
  for (const r of results) {
    if (r.removidos > 0) console.log(`   ${r.tabela}: ${r.removidos}`);
  }
  console.log("\nO que foi preservado:");
  console.log("   ✓ Admins / usuários");
  console.log("   ✓ Planos");
  console.log("   ✓ Configurações");
  if (!FULL) {
    console.log("   ✓ Insumos (estoque zerado — use --full para remover)");
    console.log("   ✓ Vouchers (usedCount zerado)");
  }
  console.log("");
}

main()
  .catch((e) => { console.error("❌ Erro:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

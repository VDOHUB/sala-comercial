import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now      = new Date();
  const mesAtual = { gte: startOfMonth(now), lte: endOfMonth(now) };
  const mesAntes = { gte: startOfMonth(subMonths(now, 1)), lte: endOfMonth(subMonths(now, 1)) };

  const [
    receitaMes,
    receitaMesAnterior,
    reservasMes,
    reservasMesAnterior,
    totalClientes,
    clientesNovos,
    proximasReservas,
    reservasPorStatus,
    receitaUltimos6Meses,
  ] = await Promise.all([
    // Receita mês atual (pagas)
    prisma.booking.aggregate({
      where: { status: { in: ["PAID", "ACTIVE", "COMPLETED"] }, paidAt: mesAtual },
      _sum: { totalAmount: true },
    }),
    // Receita mês anterior
    prisma.booking.aggregate({
      where: { status: { in: ["PAID", "ACTIVE", "COMPLETED"] }, paidAt: mesAntes },
      _sum: { totalAmount: true },
    }),
    // Reservas mês atual
    prisma.booking.count({ where: { createdAt: mesAtual } }),
    // Reservas mês anterior
    prisma.booking.count({ where: { createdAt: mesAntes } }),
    // Total clientes
    prisma.client.count(),
    // Clientes novos este mês
    prisma.client.count({ where: { createdAt: mesAtual } }),
    // Próximas reservas
    prisma.booking.findMany({
      where: { startAt: { gte: now }, status: { in: ["PAID", "ACTIVE"] } },
      include: { client: { select: { name: true, email: true } } },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    // Reservas por status
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    // Receita últimos 6 meses
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const mes = subMonths(now, i);
        return prisma.booking.aggregate({
          where: {
            status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
            paidAt: { gte: startOfMonth(mes), lte: endOfMonth(mes) },
          },
          _sum: { totalAmount: true },
        }).then((r: { _sum: { totalAmount: number | null } }) => ({
          mes: mes.toISOString().slice(0, 7),
          receita: r._sum.totalAmount ?? 0,
        }));
      })
    ),
  ]);

  const receitaAtual   = receitaMes._sum.totalAmount ?? 0;
  const receitaAnterior = receitaMesAnterior._sum.totalAmount ?? 0;
  const variacaoReceita = receitaAnterior > 0
    ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100
    : 0;

  // Taxa de ocupação (horas reservadas / horas disponíveis no mês)
  const horasDisponiveisMes = 12 * 22; // 12h/dia × ~22 dias úteis
  const reservasCompletasMes = await prisma.booking.findMany({
    where: { status: { in: ["PAID","ACTIVE","COMPLETED"] }, startAt: mesAtual },
    select: { startAt: true, endAt: true },
  });
  const horasReservadas = reservasCompletasMes.reduce((acc: number, r: { startAt: Date; endAt: Date }) => {
    return acc + (r.endAt.getTime() - r.startAt.getTime()) / 3600000;
  }, 0);
  const taxaOcupacao = Math.min(100, (horasReservadas / horasDisponiveisMes) * 100);

  // Ticket médio
  const ticketMedio = reservasMes > 0 ? receitaAtual / reservasMes : 0;

  return NextResponse.json({
    receita:         { atual: receitaAtual, anterior: receitaAnterior, variacao: variacaoReceita },
    reservas:        { mes: reservasMes, mesAnterior: reservasMesAnterior },
    clientes:        { total: totalClientes, novos: clientesNovos },
    taxaOcupacao:    Math.round(taxaOcupacao),
    ticketMedio,
    proximasReservas,
    reservasPorStatus,
    receitaUltimos6Meses: receitaUltimos6Meses.reverse(),
  });
}

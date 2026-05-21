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
    receitaBookingMes,
    receitaSubMes,
    receitaBookingMesAnterior,
    receitaSubMesAnterior,
    reservasMes,
    reservasMesAnterior,
    totalClientes,
    clientesNovos,
    proximasReservas,
    reservasPorStatus,
    receitaUltimos6Meses,
  ] = await Promise.all([
    // Receita mês atual — bookings (usa paidAt ou createdAt como fallback)
    prisma.booking.aggregate({
      where: {
        status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
        OR: [{ paidAt: mesAtual }, { paidAt: null, createdAt: mesAtual }],
      },
      _sum: { totalAmount: true },
    }),
    // Receita mês atual — assinaturas
    prisma.subscription.aggregate({
      where: { status: { in: ["ACTIVE", "EXPIRED"] }, createdAt: mesAtual },
      _sum: { totalAmount: true },
    }),
    // Receita mês anterior — bookings
    prisma.booking.aggregate({
      where: {
        status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
        OR: [{ paidAt: mesAntes }, { paidAt: null, createdAt: mesAntes }],
      },
      _sum: { totalAmount: true },
    }),
    // Receita mês anterior — assinaturas
    prisma.subscription.aggregate({
      where: { status: { in: ["ACTIVE", "EXPIRED"] }, createdAt: mesAntes },
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
    // Receita últimos 6 meses (bookings + assinaturas)
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const mes    = subMonths(now, i);
        const period = { gte: startOfMonth(mes), lte: endOfMonth(mes) };
        return Promise.all([
          prisma.booking.aggregate({
            where: {
              status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
              OR: [{ paidAt: period }, { paidAt: null, createdAt: period }],
            },
            _sum: { totalAmount: true },
          }),
          prisma.subscription.aggregate({
            where: { status: { in: ["ACTIVE", "EXPIRED"] }, createdAt: period },
            _sum: { totalAmount: true },
          }),
        ]).then(([b, s]) => ({
          mes:     mes.toISOString().slice(0, 7),
          receita: (b._sum.totalAmount ?? 0) + (s._sum.totalAmount ?? 0),
        }));
      })
    ),
  ]);

  const receitaAtual    = (receitaBookingMes._sum.totalAmount ?? 0) + (receitaSubMes._sum.totalAmount ?? 0);
  const receitaAnterior = (receitaBookingMesAnterior._sum.totalAmount ?? 0) + (receitaSubMesAnterior._sum.totalAmount ?? 0);
  const variacaoReceita = receitaAnterior > 0
    ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100
    : 0;

  // Taxa de ocupação (períodos reservados / períodos disponíveis no mês)
  // 2 períodos/dia × ~22 dias úteis = 44 períodos/mês
  const periodosDisponiveis = 2 * 22;
  const periodosReservadosMes = await prisma.booking.count({
    where: { status: { in: ["PAID","ACTIVE","COMPLETED"] }, startAt: mesAtual },
  });
  const taxaOcupacao = Math.min(100, (periodosReservadosMes / periodosDisponiveis) * 100);

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

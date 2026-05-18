"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  createdAt: string;
  _count: { bookings: number };
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/clientes")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); });
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a0e05" }}>Clientes</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,14,5,0.4)" }}>
            {clients.length} cliente{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full max-w-sm rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={{
            background: "#f5f0e8",
            border: "1px solid rgba(26,14,5,0.12)",
            color: "#1a0e05",
          }}
        />
      </div>

      {loading ? (
        <div className="animate-pulse text-center py-16 text-sm" style={{ color: "rgba(26,14,5,0.38)" }}>Carregando clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "rgba(26,14,5,0.38)" }}>
          <p className="font-medium text-lg mb-1" style={{ color: "#1a0e05" }}>
            {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
          </p>
          <p className="text-sm">Os clientes aparecem automaticamente após a primeira reserva.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#f5f0e8", border: "1px solid rgba(26,14,5,0.08)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Contato</th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Reservas</th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,14,5,0.35)" }}>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors" style={{ borderTop: "1px solid rgba(26,14,5,0.05)" }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "rgba(26,14,5,0.08)", color: "#1a0e05" }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: "#1a0e05" }}>{c.name}</p>
                        {c.cpf && <p className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>CPF: {c.cpf}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm" style={{ color: "rgba(26,14,5,0.65)" }}>{c.email}</p>
                    {c.phone && <p className="text-xs mt-0.5" style={{ color: "rgba(26,14,5,0.38)" }}>{c.phone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(26,14,5,0.07)", color: "#1a0e05" }}>
                      {c._count.bookings} reserva{c._count.bookings !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "rgba(26,14,5,0.45)" }}>
                    {format(new Date(c.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

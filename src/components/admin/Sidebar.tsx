"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin/dashboard",     label: "Dashboard"     },
  { href: "/admin/reservas",      label: "Reservas"      },
  { href: "/admin/assinaturas",   label: "Assinaturas"   },
  { href: "/admin/clientes",      label: "Clientes"      },
  { href: "/admin/leads",         label: "Leads"         },
  { href: "/admin/vouchers",      label: "Vouchers"      },
  { href: "/admin/planos",        label: "Planos"        },
  { href: "/admin/cobrancas",     label: "Cobranças"     },
  { href: "/admin/acessos",       label: "Acessos"       },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-40"
      style={{
        background: "#f5f0e8",
        borderRight: "1px solid rgba(26,14,5,0.08)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(26,14,5,0.07)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#1a0e05" }}
          >
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "#f5f0e8" }}>VDO</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: "#1a0e05" }}>VDO HUB</p>
            <p className="text-xs" style={{ color: "rgba(26,14,5,0.38)" }}>Painel admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "font-semibold"
                  : "hover:bg-[rgba(26,14,5,0.05)]"
              )}
              style={active ? {
                background: "rgba(26,14,5,0.08)",
                color: "#1a0e05",
              } : {
                color: "rgba(26,14,5,0.45)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(26,14,5,0.07)" }}>
        <Link
          href="/"
          target="_blank"
          className="flex items-center px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5"
          style={{ color: "rgba(26,14,5,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#1a0e05")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(26,14,5,0.4)")}
        >
          Ver site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm transition-all text-left"
          style={{ color: "rgba(26,14,5,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#b91c1c")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(26,14,5,0.4)")}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin/dashboard",      icon: "📊", label: "Dashboard"   },
  { href: "/admin/reservas",        icon: "📅", label: "Reservas"    },
  { href: "/admin/clientes",        icon: "👥", label: "Clientes"    },
  { href: "/admin/vouchers",        icon: "🎟️", label: "Vouchers"    },
  { href: "/admin/acessos",         icon: "🔐", label: "Acessos"     },
  { href: "/admin/configuracoes",   icon: "⚙️", label: "Configurações"},
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-950 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">VO</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Viver de Obra</p>
            <p className="text-gray-500 text-xs">Sala Comercial</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-emerald-600/15 text-emerald-400 border border-emerald-600/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all mb-1"
        >
          <span>🌐</span> Ver site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  );
}

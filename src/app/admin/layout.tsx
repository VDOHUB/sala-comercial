import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/admin/Sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin — Viver de Obra" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoginPage = false; // middleware já cuida do redirect

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-900 flex">
        <Sidebar />
        <main className="ml-60 flex-1 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/admin/Sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin — VDO HUB" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoginPage = false; // middleware já cuida do redirect

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex" style={{ background: "#ede8df" }}>
        <Sidebar />
        <main className="ml-56 flex-1 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

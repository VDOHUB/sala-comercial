import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Attachment = { id: string; name: string; url: string };

// POST /api/admin/terms-attachments/upload
// Chamado em dois momentos:
//   1. Browser → gerar token  (type: "blob.generate-client-token") — requer auth
//   2. Vercel   → notificar conclusão (type: "blob.upload-completed") — sem cookie, não requer auth
export async function POST(req: NextRequest) {
  const body = await req.json() as HandleUploadBody;

  // Só exige auth na geração do token (chamada do browser)
  if (body.type === "blob.generate-client-token") {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
          tokenPayload: JSON.stringify({ adminUpload: true }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Registrar URL no banco após upload concluir
        const setting = await prisma.setting.findUnique({ where: { key: "terms_attachments" } });
        let list: Attachment[] = [];
        if (setting?.value) {
          try { list = JSON.parse(setting.value) as Attachment[]; } catch { /* noop */ }
        }
        const id   = Date.now().toString() + Math.random().toString(36).slice(2);
        const name = decodeURIComponent(blob.pathname.split("/").pop() ?? blob.pathname);
        list.push({ id, name, url: blob.url });
        await prisma.setting.upsert({
          where:  { key: "terms_attachments" },
          update: { value: JSON.stringify(list) },
          create: { key: "terms_attachments", value: JSON.stringify(list) },
        });
        console.log("[terms-attachments] uploaded:", blob.url, "name:", name);
      },
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("[terms-attachments/upload] error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

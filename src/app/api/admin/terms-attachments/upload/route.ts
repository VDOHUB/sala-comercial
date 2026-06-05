import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Attachment = { id: string; name: string; url: string };

// POST /api/admin/terms-attachments/upload
// Chamado pelo browser em dois momentos:
//   1. Para gerar o token de upload (type: "blob.generate-client-token")
//   2. Para registrar o arquivo após o upload completar (type: "blob.upload-completed")
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Validar tipo de arquivo
        const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
        const ext = pathname.slice(pathname.lastIndexOf(".")).toLowerCase();
        if (!allowed.includes(ext)) {
          throw new Error("Tipo de arquivo não permitido. Use PDF, JPG ou PNG.");
        }
        return {
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
          tokenPayload: JSON.stringify({ adminUpload: true }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload: _ }) => {
        // Registrar URL no banco após upload concluir
        const setting = await prisma.setting.findUnique({ where: { key: "terms_attachments" } });
        let list: Attachment[] = [];
        if (setting?.value) {
          try { list = JSON.parse(setting.value) as Attachment[]; } catch { /* noop */ }
        }
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        const name = blob.pathname.split("/").pop() ?? blob.pathname;
        list.push({ id, name, url: blob.url });
        await prisma.setting.upsert({
          where:  { key: "terms_attachments" },
          update: { value: JSON.stringify(list) },
          create: { key: "terms_attachments", value: JSON.stringify(list) },
        });
        console.log("[terms-attachments] uploaded:", blob.url);
      },
    });

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

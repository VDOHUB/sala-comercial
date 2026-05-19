import { prisma } from "@/lib/prisma";

const DEFAULT_TERMS = `**TERMOS DE USO — VDO HUB**

**1. Objeto**
O VDO HUB disponibiliza espaço comercial privativo por período (matutino ou vespertino), com acesso automatizado por reconhecimento facial.

**2. Reservas e Pagamento**
As reservas são realizadas exclusivamente pelo site, com pagamento via cartão de crédito. Após a confirmação do pagamento, o acesso é liberado automaticamente para o período contratado.

**3. Cancelamento**
Cancelamentos devem ser solicitados com no mínimo 24 horas de antecedência pelo WhatsApp (62) 99633-2257. Não há reembolso para cancelamentos realizados em prazo inferior.

**4. Uso do Espaço**
O cliente é responsável pelo uso adequado das instalações. Danos causados ao espaço, equipamentos ou mobiliário serão cobrados do responsável pela reserva.

**5. Frigobar e Café**
O espaço dispõe de frigobar e café. O consumo é cobrado à parte conforme tabela disponível no local.

**6. Acesso**
O acesso é concedido exclusivamente ao titular do cadastro, por reconhecimento facial. A transferência de acesso para terceiros é vedada.

**7. Privacidade**
Os dados pessoais (incluindo foto facial) são utilizados exclusivamente para controle de acesso e comunicações relacionadas à reserva, em conformidade com a LGPD.

**8. Vigência**
Estes termos são válidos a partir da realização da reserva e se aplicam a todas as utilizações do espaço.`;

export default async function TermosPage() {
  const setting = await prisma.setting.findUnique({ where: { key: "terms" } });
  const content = setting?.value || DEFAULT_TERMS;

  // Convert markdown-like bold (**text**) to HTML
  const html = content
    .split("\n")
    .map((line) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (bold.startsWith("<strong>") && bold.endsWith("</strong>") && !bold.slice(8).includes("<strong>")) {
        return `<h3>${bold}</h3>`;
      }
      return bold || "<br/>";
    })
    .join("\n");

  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-5 py-16">
        <a
          href="/"
          className="inline-flex items-center gap-2 mb-10 text-sm font-medium"
          style={{ color: "rgba(26,14,5,0.45)" }}
        >
          ← Voltar
        </a>
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#1a0e05" }}>
          Termos de Uso
        </h1>
        <p className="text-sm mb-10" style={{ color: "rgba(26,14,5,0.4)" }}>VDO HUB — Anápolis, GO</p>

        <div
          className="prose prose-sm max-w-none space-y-4 text-sm leading-relaxed"
          style={{ color: "rgba(26,14,5,0.7)" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

// Validação e normalização dos dados de cartão nas páginas do portal do cliente.
// Evita mandar ao servidor algo que ele recusaria e mostra ao cliente EXATAMENTE o que corrigir.

export type CardForm = {
  holderName: string;
  cpf: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  postalCode: string;
  addressNumber: string;
};

export type CardPayload = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  cpf?: string;
  postalCode: string;
  addressNumber: string;
};

const digits = (s: string) => s.replace(/\D/g, "");

/** Converte o formulário no corpo que a API espera, ou devolve a mensagem do que está errado. */
export function buildCardPayload(card: CardForm): { ok: true; card: CardPayload } | { ok: false; error: string } {
  const holderName = card.holderName.trim();
  if (holderName.length < 2) return { ok: false, error: "Informe o nome como está impresso no cartão." };

  const number = digits(card.number);
  if (number.length < 13 || number.length > 19) return { ok: false, error: "Número do cartão incompleto. Confira os dígitos." };

  const month = Number(digits(card.expiryMonth));
  if (!month || month < 1 || month > 12) return { ok: false, error: "Mês de validade inválido. Use de 01 a 12." };

  let year = digits(card.expiryYear);
  if (year.length === 2) year = `20${year}`; // "34" → "2034"
  const thisYear = new Date().getFullYear();
  if (year.length !== 4 || Number(year) < thisYear) {
    return { ok: false, error: "Ano de validade inválido. Use 4 dígitos, por exemplo 2030." };
  }

  const ccv = digits(card.ccv);
  if (ccv.length < 3 || ccv.length > 4) return { ok: false, error: "CVV inválido. São 3 ou 4 números no verso do cartão." };

  const doc = digits(card.cpf);
  if (doc && doc.length !== 11 && doc.length !== 14) return { ok: false, error: "CPF/CNPJ do titular inválido. Confira os números." };

  const postalCode = digits(card.postalCode);
  if (postalCode.length !== 8) return { ok: false, error: "Informe o CEP do titular com 8 números." };

  const addressNumber = card.addressNumber.trim();
  if (!addressNumber) return { ok: false, error: "Informe o número do endereço do titular (ou S/N)." };

  return {
    ok: true,
    card: {
      holderName,
      number,
      expiryMonth: String(month).padStart(2, "0"),
      expiryYear: year,
      ccv,
      cpf: doc || undefined,
      postalCode,
      addressNumber,
    },
  };
}

/**
 * Sempre devolve texto. A página renderiza o erro direto no JSX: se o servidor mandar um objeto,
 * o React lança "Objects are not valid as a React child" e a tela inteira cai.
 */
export function errorText(e: unknown, fallback: string): string {
  if (typeof e === "string" && e.trim()) return e;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}

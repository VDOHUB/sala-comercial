import axios from "axios";

export const asaas = axios.create({
  baseURL: process.env.ASAAS_BASE_URL,
  headers: {
    "access_token": process.env.ASAAS_API_KEY,
    "Content-Type": "application/json",
  },
});

// ── Criar cliente no ASAAS ────────────────────────────────────────
export async function createAsaasCustomer(data: {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}) {
  const res = await asaas.post("/customers", data);
  return res.data as { id: string };
}

// ── Criar cobrança ────────────────────────────────────────────────
export async function createAsaasCharge(data: {
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
  value: number;
  dueDate: string;          // YYYY-MM-DD
  description: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    postalCode?: string;
    addressNumber?: string;
    addressComplement?: string;
    address?: string;
  };
}) {
  const res = await asaas.post("/payments", data);
  return res.data as {
    id: string;
    invoiceUrl: string;
    pixQrCodeUrl?: string;
    status: string;
  };
}

// ── Consultar status do pagamento ─────────────────────────────────
export async function getAsaasPayment(chargeId: string) {
  const res = await asaas.get(`/payments/${chargeId}`);
  return res.data as { id: string; status: string };
}

// ── Tokenizar cartão (sem cobrança) ──────────────────────────────
export async function tokenizeAsaasCard(data: {
  customer: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    postalCode?: string;
    addressNumber?: string;
    addressComplement?: string;
    address?: string;
  };
}): Promise<{ creditCardToken: string; creditCardBrand: string; creditCardNumber: string }> {
  const res = await asaas.post("/creditCard/tokenize", {
    customer:             data.customer,
    creditCard:           data.creditCard,
    creditCardHolderInfo: data.creditCardHolderInfo,
  });
  return res.data;
}

// ── Cobrança com token salvo ───────────────────────────────────────
export async function createAsaasChargeWithToken(data: {
  customer: string;
  creditCardToken: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
}) {
  const res = await asaas.post("/payments", {
    customer:        data.customer,
    billingType:     "CREDIT_CARD",
    value:           data.value,
    dueDate:         data.dueDate,
    description:     data.description,
    externalReference: data.externalReference,
    creditCardToken: data.creditCardToken,
  });
  return res.data as { id: string; invoiceUrl: string; status: string };
}

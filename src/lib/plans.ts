// Planos padrão — usados como fallback quando não há configuração no banco
export type Plan = {
  key: string;
  label: string;
  price: number;
  installments: string;
  maxInstallments: number;
  credits: number;
  validityMonths: number | null;
};

export const DEFAULT_PLANS: Plan[] = [
  { key: "HUB_ONE",     label: "HUB ONE — 1 período",       price: 300,  installments: "ou 3x R$100",  maxInstallments: 3,  credits: 1,  validityMonths: null },
  { key: "HUB_FIVE",    label: "HUB FIVE — 5 períodos",     price: 1200, installments: "ou 10x R$120", maxInstallments: 10, credits: 5,  validityMonths: 6   },
  { key: "HUB_TEN",     label: "HUB TEN — 10 períodos",     price: 2200, installments: "ou 10x R$220", maxInstallments: 10, credits: 10, validityMonths: 8   },
  { key: "HUB_PARTNER", label: "HUB PARTNER — 15 períodos", price: 3000, installments: "ou 10x R$300", maxInstallments: 10, credits: 15, validityMonths: 12  },
];

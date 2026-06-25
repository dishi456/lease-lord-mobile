export const PAYMENT_METHODS = [
  { k: "CASH", l: "Cash" },
  { k: "UPI", l: "UPI" },
  { k: "CREDIT_CARD", l: "Credit Card" },
  { k: "DEBIT_CARD", l: "Debit Card" },
  { k: "BANK_TRANSFER", l: "Bank Transfer" },
  { k: "E_TRANSFER", l: "E-Transfer" },
  { k: "CHEQUE", l: "Cheque" },
  { k: "NET_BANKING", l: "Net Banking" },
  { k: "OTHER", l: "Other" },
];
export const methodLabel = (k: string) => PAYMENT_METHODS.find((m) => m.k === k)?.l ?? k;

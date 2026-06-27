/** Money + line-item math shared by offers, invoices, and the AI drafter. */

/** Round to 2 decimals (cents). */
export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export interface LineLike {
  quantity: number;
  unitPrice: number;
}

export const lineTotal = (quantity: number, unitPrice: number): number =>
  round2(quantity * unitPrice);

export interface Totals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

/** subtotal -> tax -> grand total, each rounded to cents. */
export const computeTotals = (lines: LineLike[], taxRate: number): Totals => {
  const subtotal = round2(
    lines.reduce((sum, l) => sum + lineTotal(l.quantity, l.unitPrice), 0),
  );
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
};

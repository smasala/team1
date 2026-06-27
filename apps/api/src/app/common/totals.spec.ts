import { computeTotals, lineTotal, round2 } from './totals';

describe('totals', () => {
  it('rounds half up to two decimals', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
  });

  it('computes a line total', () => {
    expect(lineTotal(3, 2.5)).toBe(7.5);
  });

  it('computes subtotal, tax, and grand total', () => {
    const t = computeTotals(
      [
        { quantity: 2, unitPrice: 10 },
        { quantity: 1, unitPrice: 5 },
      ],
      0.19,
    );
    expect(t.subtotal).toBe(25);
    expect(t.taxAmount).toBe(4.75);
    expect(t.total).toBe(29.75);
  });
});

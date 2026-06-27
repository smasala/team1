import { applyMarkup, computeTotals, lineTotal, round2 } from './totals';

describe('totals', () => {
  it('applies a strict 30% markup rounded to cents', () => {
    expect(applyMarkup(151.8, 30)).toBe(197.34);
    expect(applyMarkup(35.5, 30)).toBe(46.15);
    expect(applyMarkup(100, 30)).toBe(130);
  });

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

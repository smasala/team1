import { expandTerms } from './language';
import { parsePrompt } from './offer-parser';

describe('offer parser', () => {
  it('extracts quantity and normalizes a glued unit (100m2 -> m²)', () => {
    const [seg] = parsePrompt('100m2 house demolition');
    expect(seg.quantity).toBe(100);
    expect(seg.unit).toBe('m²');
    expect(seg.terms).toEqual(expect.arrayContaining(['house', 'demolition']));
  });

  it('splits multiple segments and reads each unit', () => {
    const segs = parsePrompt('50 m2 plaster and 8 hours excavation');
    expect(segs).toHaveLength(2);
    expect(segs[0].unit).toBe('m²');
    expect(segs[1].quantity).toBe(8);
    expect(segs[1].unit).toBe('h');
  });

  it('defaults quantity to 1 when none is given', () => {
    const [seg] = parsePrompt('tiling work');
    expect(seg.quantity).toBe(1);
  });
});

describe('expandTerms', () => {
  it('maps English trade terms to German catalogue keywords', () => {
    expect(expandTerms(['demolition'])).toEqual(
      expect.arrayContaining(['demolition', 'abbruch']),
    );
    expect(expandTerms(['plaster'])).toContain('putz');
  });
});

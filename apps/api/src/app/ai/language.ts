/**
 * Lightweight domain language resources for the offer parser: unit
 * normalisation, filler words to drop, and an English -> German trade-term
 * expansion so English prompts still match the German catalogue.
 */

/** Maps many spellings to the catalogue's canonical unit strings. */
const UNIT_ALIASES: Record<string, string> = {
  'm²': 'm²',
  m2: 'm²',
  qm: 'm²',
  sqm: 'm²',
  'm³': 'm³',
  m3: 'm³',
  cbm: 'm³',
  m: 'm',
  lfm: 'm',
  meter: 'm',
  st: 'St',
  stk: 'St',
  stck: 'St',
  stück: 'St',
  stueck: 'St',
  pcs: 'St',
  piece: 'St',
  pieces: 'St',
  h: 'h',
  hr: 'h',
  hrs: 'h',
  hour: 'h',
  hours: 'h',
  std: 'h',
  stunde: 'h',
  stunden: 'h',
  kg: 'kg',
  t: 't',
  to: 't',
};

/** Longest-first list of unit tokens for the quantity regex. */
export const UNIT_TOKENS = Object.keys(UNIT_ALIASES).sort(
  (a, b) => b.length - a.length,
);

export const normalizeUnit = (raw: string): string | null =>
  UNIT_ALIASES[raw.toLowerCase()] ?? null;

/** Filler words (EN + DE) stripped before keyword matching. */
export const STOPWORDS = new Set([
  'i',
  'we',
  'need',
  'want',
  'a',
  'an',
  'the',
  'offer',
  'quote',
  'for',
  'of',
  'to',
  'and',
  'with',
  'some',
  'please',
  'make',
  'create',
  'build',
  'my',
  'ich',
  'wir',
  'brauche',
  'möchte',
  'mochte',
  'ein',
  'eine',
  'einen',
  'angebot',
  'für',
  'fur',
  'von',
  'und',
  'mit',
  'das',
  'der',
  'die',
  'bitte',
  'erstellen',
  'machen',
]);

/** English trade term -> German catalogue keywords. */
const SYNONYMS: Record<string, string[]> = {
  demolition: ['abbruch', 'abbrechen', 'abriss'],
  demolish: ['abbruch', 'abbrechen'],
  demo: ['abbruch'],
  wall: ['wand', 'mauer'],
  walls: ['wand', 'mauer'],
  masonry: ['maurer', 'mauerwerk'],
  excavation: ['aushub', 'erdaushub'],
  excavate: ['aushub'],
  dig: ['aushub', 'graben'],
  earthwork: ['erdarbeiten', 'erdaushub'],
  concrete: ['beton'],
  plaster: ['putz'],
  paint: ['anstrich', 'malerarbeiten', 'streichen'],
  painting: ['anstrich', 'malerarbeiten'],
  tile: ['fliesen'],
  tiles: ['fliesen'],
  tiling: ['fliesen'],
  roof: ['dach'],
  roofing: ['dach'],
  scaffold: ['gerüst', 'geruest'],
  scaffolding: ['gerüst', 'geruest'],
  insulation: ['dämmung', 'daemmung', 'wärmedämmung'],
  window: ['fenster'],
  windows: ['fenster'],
  door: ['tür', 'tuer'],
  doors: ['tür', 'tuer'],
  floor: ['boden', 'estrich'],
  flooring: ['boden', 'estrich'],
  screed: ['estrich'],
  house: ['haus', 'gebäude', 'gebaeude'],
  building: ['gebäude', 'gebaeude'],
  foundation: ['fundament'],
  drywall: ['trockenbau', 'gipskarton'],
  disposal: ['entsorgung', 'abfall'],
  removal: ['entfernen', 'abbruch'],
};

/** Expand cleaned keywords with their German trade synonyms (deduped). */
export const expandTerms = (terms: string[]): string[] => {
  const out = new Set<string>();
  for (const term of terms) {
    out.add(term);
    for (const syn of SYNONYMS[term] ?? []) out.add(syn);
  }
  // Array.from (not [...out]) — the webpack down-level of spreading a Set is
  // unreliable here and can wrap the Set instead of spreading its values.
  return Array.from(out);
};

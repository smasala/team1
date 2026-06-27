/** Human-readable document numbers, e.g. OFF-2026-1A2B3C / INV-2026-… */
export const makeDocNumber = (prefix: string): string => {
  const year = new Date().getFullYear();
  const seq = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-${year}-${seq}`;
};

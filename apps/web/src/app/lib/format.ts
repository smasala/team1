/** German-locale money/date formatting (the catalogue is EUR / de-DE). */
export const formatMoney = (n: number, currency = 'EUR'): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(
    Number.isFinite(n) ? n : 0,
  );

export const formatDate = (iso: string | null | undefined): string =>
  iso
    ? new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso))
    : '—';

export const formatPercent = (fraction: number): string =>
  `${Math.round(fraction * 100)}%`;

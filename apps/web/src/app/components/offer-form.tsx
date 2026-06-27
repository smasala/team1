import { useState } from 'react';
import type { LineInput } from '../api/endpoints';
import { LineDraft, LineEditor, toLineInput } from './line-editor';
import { ErrorBanner, Field, Sheet } from './ui';

export interface OfferSubmit {
  title?: string;
  customerName?: string;
  customerEmail?: string;
  taxRate: number;
  items: LineInput[];
}

interface Initial {
  title?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  taxRate?: number;
  lines?: LineDraft[];
}

/** Shared create/edit form for offers (reused by the list and detail views). */
export function OfferFormSheet({
  heading,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: {
  heading: string;
  submitLabel: string;
  initial?: Initial;
  onClose: () => void;
  onSubmit: (values: OfferSubmit) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [customerName, setCustomerName] = useState(initial?.customerName ?? '');
  const [customerEmail, setCustomerEmail] = useState(
    initial?.customerEmail ?? '',
  );
  const [taxPct, setTaxPct] = useState(
    String(Math.round((initial?.taxRate ?? 0.19) * 100)),
  );
  const [lines, setLines] = useState<LineDraft[]>(initial?.lines ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title: title || undefined,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        taxRate: (Number(taxPct) || 0) / 100,
        items: lines.map(toLineInput),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <Sheet title={heading} onClose={onClose}>
      <div className="stack">
        {error && <ErrorBanner message={error} />}
        <Field label="Title">
          <input
            className="input"
            placeholder="e.g. Bathroom renovation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Field label="Customer">
            <input
              className="input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>
          <Field label="VAT %">
            <input
              className="input"
              type="number"
              min={0}
              step="any"
              style={{ width: 90 }}
              value={taxPct}
              onChange={(e) => setTaxPct(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Customer email">
          <input
            className="input"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </Field>

        <div className="divider" />
        <div className="eyebrow">Line items</div>
        <LineEditor lines={lines} setLines={setLines} />

        <button
          className="btn primary block"
          onClick={submit}
          disabled={busy || lines.length === 0}
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </Sheet>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OfferDto } from 'shared-types';
import { api } from '../api/endpoints';
import { IconOffers, IconPlus } from '../components/icons';
import {
  LineDraft,
  LineEditor,
  toLineInput,
} from '../components/line-editor';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  Money,
  PageHead,
  Sheet,
  StatusBadge,
} from '../components/ui';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/use-async';

export function OffersPage() {
  const navigate = useNavigate();
  const offers = useAsync(() => api.offers.list(), []);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHead
        eyebrow="Customer proposals"
        title="Offers"
        action={
          <button className="btn primary sm" onClick={() => setCreating(true)}>
            <IconPlus /> New
          </button>
        }
      />

      {offers.loading ? (
        <Loading />
      ) : offers.error ? (
        <ErrorBanner message={offers.error} />
      ) : (offers.data ?? []).length === 0 ? (
        <EmptyState icon={<IconOffers />} title="No offers yet">
          Create one manually, or let the assistant draft it.
        </EmptyState>
      ) : (
        <div className="stack">
          {(offers.data ?? []).map((o) => (
            <button
              key={o.id}
              className="card tap"
              onClick={() => navigate(`/offers/${o.id}`)}
              style={{ textAlign: 'left', color: 'inherit', display: 'block' }}
            >
              <div className="row between">
                <span className="readout tiny faint">{o.number}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="row between" style={{ marginTop: 8 }}>
                <div className="grow">
                  <div className="truncate">
                    {o.title ?? o.customerName ?? 'Untitled offer'}
                  </div>
                  <div className="tiny faint">
                    {o.items.length} items · {formatDate(o.createdAt)}
                  </div>
                </div>
                <Money value={o.total} currency={o.currency} hi />
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <CreateOfferSheet
          onClose={() => setCreating(false)}
          onCreated={(o) => navigate(`/offers/${o.id}`)}
        />
      )}
    </div>
  );
}

function CreateOfferSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (offer: OfferDto) => void;
}) {
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [taxRate, setTaxRate] = useState('19');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const offer = await api.offers.create({
        title: title || undefined,
        customerName: customerName || undefined,
        taxRate: (Number(taxRate) || 0) / 100,
        items: lines.map(toLineInput),
      });
      onCreated(offer);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <Sheet title="New offer" onClose={onClose}>
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
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </Field>
        </div>

        <div className="divider" />
        <div className="eyebrow">Line items</div>
        <LineEditor lines={lines} setLines={setLines} />

        <button
          className="btn primary block"
          onClick={save}
          disabled={busy || lines.length === 0}
        >
          {busy ? 'Creating…' : 'Create offer'}
        </button>
      </div>
    </Sheet>
  );
}

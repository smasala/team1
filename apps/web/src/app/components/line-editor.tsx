import { useState } from 'react';
import type { ItemDto } from 'shared-types';
import { api, type LineInput } from '../api/endpoints';
import { useI18n } from '../i18n/i18n';
import { useAsync } from '../lib/use-async';
import { formatMoney } from '../lib/format';
import { IconPlus, IconSearch, IconTrash } from './icons';
import { Loading, Money, Sheet } from './ui';

export interface LineDraft {
  itemId?: string;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
}

export const toLineInput = (l: LineDraft): LineInput => ({
  itemId: l.itemId,
  description: l.description,
  unit: l.unit ?? undefined,
  quantity: l.quantity,
  unitPrice: l.unitPrice,
});

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Editable list of offer/invoice line items with a catalogue picker. */
export function LineEditor({
  lines,
  setLines,
  currency = 'EUR',
}: {
  lines: LineDraft[];
  setLines: (lines: LineDraft[]) => void;
  currency?: string;
}) {
  const { t } = useI18n();
  const [picking, setPicking] = useState(false);

  const update = (i: number, patch: Partial<LineDraft>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const add = (item: ItemDto) => {
    setLines([
      ...lines,
      {
        itemId: item.id,
        description: item.description,
        unit: item.unit,
        quantity: 1,
        unitPrice: item.price,
      },
    ]);
    setPicking(false);
  };

  const subtotal = round2(
    lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
  );

  return (
    <div>
      {lines.length === 0 && (
        <p className="muted small" style={{ margin: '4px 0 12px' }}>
          {t('line.empty')}
        </p>
      )}

      <div className="stack">
        {lines.map((l, i) => (
          <div className="card" key={i} style={{ padding: 12 }}>
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <div className="small truncate">{l.description}</div>
                <div className="tiny faint">
                  {formatMoney(l.unitPrice, currency)} /{' '}
                  {l.unit ?? t('line.unitFallback')}
                </div>
              </div>
              <button
                className="btn ghost sm"
                onClick={() => remove(i)}
                aria-label={t('line.removeLine')}
              >
                <IconTrash />
              </button>
            </div>
            <div className="row between" style={{ marginTop: 10 }}>
              <div className="row" style={{ gap: 8 }}>
                <input
                  className="input"
                  style={{ width: 84 }}
                  type="number"
                  min={0}
                  step="any"
                  value={l.quantity}
                  onChange={(e) =>
                    update(i, { quantity: Number(e.target.value) || 0 })
                  }
                  aria-label={t('line.quantity')}
                />
                <span className="muted small">{t('line.qty')}</span>
              </div>
              <Money value={round2(l.quantity * l.unitPrice)} currency={currency} />
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn ghost block"
        style={{ marginTop: 12 }}
        onClick={() => setPicking(true)}
      >
        <IconPlus /> {t('line.add')}
      </button>

      <div className="row between" style={{ marginTop: 14 }}>
        <span className="muted">{t('line.subtotal')}</span>
        <Money value={subtotal} currency={currency} hi />
      </div>

      {picking && <ItemPicker onPick={add} onClose={() => setPicking(false)} />}
    </div>
  );
}

/** Search-the-catalogue sheet for adding a line. */
function ItemPicker({
  onPick,
  onClose,
}: {
  onPick: (item: ItemDto) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const { data, loading } = useAsync<ItemDto[]>(
    () => (search.length >= 2 ? api.items.list({ search, take: 30 }) : Promise.resolve([])),
    [search],
  );

  return (
    <Sheet title={t('line.addItem')} onClose={onClose}>
      <div className="search" style={{ marginBottom: 14 }}>
        <IconSearch />
        <input
          autoFocus
          placeholder={t('line.searchCatalogue')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && search.length >= 2 ? (
        <Loading />
      ) : (
        <div>
          {(data ?? []).map((item) => (
            <button
              key={item.id}
              className="list-row"
              onClick={() => onPick(item)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--line)',
                color: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div className="grow">
                <div className="small truncate">{item.description}</div>
                <div className="tiny faint">
                  {t('line.perUnit', { unit: item.unit })}
                </div>
              </div>
              <Money value={item.price} currency={item.currency} hi />
            </button>
          ))}
          {search.length >= 2 && !loading && (data ?? []).length === 0 && (
            <p className="muted small" style={{ textAlign: 'center' }}>
              {t('line.noMatch', { q: search })}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

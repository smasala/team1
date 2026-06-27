import { useState } from 'react';
import type { ItemDto } from 'shared-types';
import { api, type CategoryListItem } from '../api/endpoints';
import {
  IconBack,
  IconCatalogue,
  IconChevron,
  IconPlus,
  IconSearch,
  IconTrash,
} from '../components/icons';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  Money,
  PageHead,
  Sheet,
} from '../components/ui';
import { formatMoney } from '../lib/format';
import { useAsync } from '../lib/use-async';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function CataloguePage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<CategoryListItem | null>(null);
  const [editing, setEditing] = useState<ItemDto | null>(null);
  const [creating, setCreating] = useState(false);

  const categories = useAsync(() => api.categories.list(), []);
  const itemsKey = search.length >= 2 ? `s:${search}` : cat ? `c:${cat.id}` : '_';
  const items = useAsync<ItemDto[]>(() => {
    if (search.length >= 2) return api.items.list({ search, take: 50 });
    if (cat) return api.items.list({ categoryId: cat.id, take: 100 });
    return Promise.resolve([]);
  }, [itemsKey]);

  const showItems = search.length >= 2 || !!cat;

  return (
    <div>
      <PageHead
        eyebrow="Priced catalogue"
        title="Catalogue"
        subtitle="2,869 items · +30% markup applied"
      />

      <div className="search" style={{ marginBottom: 16 }}>
        <IconSearch />
        <input
          placeholder="Search all items…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCat(null);
          }}
        />
      </div>

      {!showItems &&
        (categories.loading ? (
          <Loading />
        ) : categories.error ? (
          <ErrorBanner message={categories.error} />
        ) : (
          <div className="stack">
            {(categories.data ?? []).map((c) => (
              <button
                key={c.id}
                className="card tap row between"
                onClick={() => {
                  setCat(c);
                  setSearch('');
                }}
                style={{ textAlign: 'left', color: 'inherit' }}
              >
                <div className="grow">
                  <div className="truncate" style={{ textTransform: 'capitalize' }}>
                    {c.name.toLowerCase()}
                  </div>
                  <div className="tiny faint readout">
                    {c._count?.items ?? 0} items · {c._count?.subcategories ?? 0}{' '}
                    groups
                  </div>
                </div>
                <IconChevron />
              </button>
            ))}
          </div>
        ))}

      {showItems && (
        <div>
          <div className="row between" style={{ marginBottom: 12 }}>
            {cat && !search ? (
              <button className="btn ghost sm" onClick={() => setCat(null)}>
                <IconBack /> Categories
              </button>
            ) : (
              <span className="muted small">Results for “{search}”</span>
            )}
            {cat && !search && (
              <button className="btn primary sm" onClick={() => setCreating(true)}>
                <IconPlus /> Item
              </button>
            )}
          </div>

          {cat && !search && (
            <div
              className="eyebrow"
              style={{ marginBottom: 10, textTransform: 'capitalize' }}
            >
              {cat.name.toLowerCase()}
            </div>
          )}

          {items.loading ? (
            <Loading />
          ) : items.error ? (
            <ErrorBanner message={items.error} />
          ) : (items.data ?? []).length === 0 ? (
            <EmptyState icon={<IconCatalogue />} title="No items found">
              Try another search term.
            </EmptyState>
          ) : (
            <div className="card" style={{ padding: '4px 14px' }}>
              {(items.data ?? []).map((it) => (
                <button
                  key={it.id}
                  className="list-row"
                  onClick={() => setEditing(it)}
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
                    <div className="small truncate">{it.description}</div>
                    <div className="tiny faint">
                      base {formatMoney(it.basePrice)} · +{it.markupPct}% · per{' '}
                      {it.unit}
                    </div>
                  </div>
                  <Money value={it.price} currency={it.currency} hi />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <ItemSheet
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void items.reload();
          }}
        />
      )}
      {creating && cat && (
        <ItemSheet
          categoryId={cat.id}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            void items.reload();
            void categories.reload();
          }}
        />
      )}
    </div>
  );
}

/** Create or edit a catalogue item. Sell price is shown live from the markup. */
function ItemSheet({
  item,
  categoryId,
  onClose,
  onSaved,
}: {
  item?: ItemDto;
  categoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(item?.description ?? '');
  const [unit, setUnit] = useState(item?.unit ?? 'St');
  const [basePrice, setBasePrice] = useState(String(item?.basePrice ?? ''));
  const [markupPct, setMarkupPct] = useState(String(item?.markupPct ?? 30));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sell = round2(
    (Number(basePrice) || 0) * (1 + (Number(markupPct) || 0) / 100),
  );

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        description,
        unit,
        basePrice: Number(basePrice),
        markupPct: Number(markupPct),
      };
      if (item) await api.items.update(item.id, payload);
      else await api.items.create({ ...payload, categoryId: categoryId! });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const del = async () => {
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      await api.items.remove(item.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <Sheet title={item ? 'Edit item' : 'New item'} onClose={onClose}>
      <div className="stack">
        {error && <ErrorBanner message={error} />}
        <Field label="Description">
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Field label="Unit">
            <input
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </Field>
          <Field label="Base price (€)">
            <input
              className="input"
              type="number"
              min={0}
              step="any"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Markup %">
          <input
            className="input"
            type="number"
            min={0}
            step="any"
            value={markupPct}
            onChange={(e) => setMarkupPct(e.target.value)}
          />
        </Field>

        <div className="row between">
          <span className="muted">Sell price</span>
          <Money value={sell} hi />
        </div>

        <button
          className="btn primary block"
          onClick={save}
          disabled={busy || !description || !basePrice}
        >
          {busy ? 'Saving…' : 'Save item'}
        </button>
        {item && (
          <button className="btn danger block" onClick={del} disabled={busy}>
            <IconTrash /> Delete item
          </button>
        )}
      </div>
    </Sheet>
  );
}

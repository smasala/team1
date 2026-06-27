import { useState } from 'react';
import type { ItemDto } from 'shared-types';
import { api, type CategoryListItem } from '../api/endpoints';
import {
  IconBack,
  IconCatalogue,
  IconChevron,
  IconPlus,
  IconSearch,
} from '../components/icons';
import {
  EmptyState,
  ErrorBanner,
  Loading,
  Money,
  PageHead,
} from '../components/ui';
import { useI18n } from '../i18n/i18n';
import { useAsync } from '../lib/use-async';
import { ItemSheet } from './item-sheet';

export function CataloguePage() {
  const { t } = useI18n();
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
        eyebrow={t('cat.eyebrow')}
        title={t('cat.title')}
        subtitle={t('cat.subtitle')}
      />

      <div className="search" style={{ marginBottom: 16 }}>
        <IconSearch />
        <input
          placeholder={t('cat.searchAll')}
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
                style={{ width: '100%', textAlign: 'left', color: 'inherit' }}
              >
                <div className="grow">
                  <div className="truncate" style={{ textTransform: 'capitalize' }}>
                    {c.name.toLowerCase()}
                  </div>
                  <div className="tiny faint readout">
                    {t('cat.itemsGroups', {
                      items: c._count?.items ?? 0,
                      groups: c._count?.subcategories ?? 0,
                    })}
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
                <IconBack /> {t('cat.categoriesBack')}
              </button>
            ) : (
              <span className="muted small">
                {t('cat.resultsFor', { q: search })}
              </span>
            )}
            {cat && !search && (
              <button className="btn primary sm" onClick={() => setCreating(true)}>
                <IconPlus /> {t('cat.addItem')}
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
            <EmptyState icon={<IconCatalogue />} title={t('cat.noItems')}>
              {t('cat.tryAnother')}
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
                      {t('cat.itemMeta', { unit: it.unit })}
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

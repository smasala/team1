import { useState } from 'react';
import type { ItemDto } from 'shared-types';
import { api } from '../api/endpoints';
import { IconTrash } from '../components/icons';
import { ErrorBanner, Field, Sheet } from '../components/ui';
import { useI18n } from '../i18n/i18n';

/** Create or edit a single catalogue item (one sell price, markup already baked in). */
export function ItemSheet({
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
  const { t } = useI18n();
  const [description, setDescription] = useState(item?.description ?? '');
  const [unit, setUnit] = useState(item?.unit ?? 'St');
  const [price, setPrice] = useState(String(item?.price ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = { description, unit, price: Number(price) };
      if (item) await api.items.update(item.id, payload);
      else if (categoryId) await api.items.create({ ...payload, categoryId });
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
    <Sheet title={item ? t('cat.editItem') : t('cat.newItem')} onClose={onClose}>
      <div className="stack">
        {error && <ErrorBanner message={error} />}
        <Field label={t('cat.description')}>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Field label={t('common.unit')}>
            <input
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </Field>
          <Field label={t('cat.price')}>
            <input
              className="input"
              type="number"
              min={0}
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        </div>

        <button
          className="btn primary block"
          onClick={save}
          disabled={busy || !description || !price}
        >
          {busy ? t('common.saving') : t('cat.saveItem')}
        </button>
        {item && (
          <button className="btn danger block" onClick={del} disabled={busy}>
            <IconTrash /> {t('cat.deleteItem')}
          </button>
        )}
      </div>
    </Sheet>
  );
}

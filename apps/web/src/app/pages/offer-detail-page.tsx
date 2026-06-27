import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OFFER_STATUSES, type OfferStatus } from 'shared-types';
import { api } from '../api/endpoints';
import { DocumentView } from '../components/document-view';
import { IconBack, IconInvoice, IconTrash } from '../components/icons';
import { OfferFormSheet } from '../components/offer-form';
import {
  ErrorBanner,
  Loading,
  PageHead,
  StatusBadge,
} from '../components/ui';
import { useI18n } from '../i18n/i18n';
import { useAsync } from '../lib/use-async';

export function OfferDetailPage() {
  const { t } = useI18n();
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const offer = useAsync(() => api.offers.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const o = offer.data;

  const setStatus = async (status: OfferStatus) => {
    setError(null);
    try {
      await api.offers.update(id, { status });
      void offer.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const generateInvoice = async () => {
    setBusy(true);
    setError(null);
    try {
      const inv = await api.invoices.fromOffer(id);
      navigate(`/invoices/${inv.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t('offers.confirmDelete'))) return;
    setBusy(true);
    try {
      await api.offers.remove(id);
      navigate('/offers');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        className="btn ghost sm"
        onClick={() => navigate('/offers')}
        style={{ marginBottom: 12 }}
      >
        <IconBack /> {t('nav.offers')}
      </button>

      {offer.loading ? (
        <Loading />
      ) : offer.error || !o ? (
        <ErrorBanner message={offer.error ?? t('offers.notFound')} />
      ) : (
        <div className="stack">
          <PageHead
            eyebrow={o.number ?? t('offers.fallback')}
            title={o.title ?? o.customerName ?? t('offers.fallback')}
          />

          <div className="row between">
            <StatusBadge status={o.status} />
            <select
              className="select"
              style={{ width: 'auto' }}
              value={o.status}
              onChange={(e) => setStatus(e.target.value as OfferStatus)}
            >
              {OFFER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>

          {error && <ErrorBanner message={error} />}

          <DocumentView doc={o} />

          <button
            className="btn ghost block"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
            {t('offers.edit')}
          </button>
          <button
            className="btn primary block"
            onClick={generateInvoice}
            disabled={busy}
          >
            <IconInvoice />{' '}
            {busy ? t('common.working') : t('offers.generateInvoice')}
          </button>
          <button className="btn danger block" onClick={remove} disabled={busy}>
            <IconTrash /> {t('offers.delete')}
          </button>
        </div>
      )}

      {editing && o && (
        <OfferFormSheet
          heading={t('offers.edit')}
          submitLabel={t('offers.save')}
          initial={{
            title: o.title,
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            taxRate: o.taxRate,
            lines: o.items.map((li) => ({
              itemId: li.itemId ?? undefined,
              description: li.description,
              unit: li.unit,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
            })),
          }}
          onClose={() => setEditing(false)}
          onSubmit={async (values) => {
            await api.offers.update(id, values);
            setEditing(false);
            void offer.reload();
          }}
        />
      )}
    </div>
  );
}

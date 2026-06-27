import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OFFER_STATUSES, type OfferStatus } from 'shared-types';
import { api } from '../api/endpoints';
import { DocumentView } from '../components/document-view';
import { IconBack, IconInvoice, IconTrash } from '../components/icons';
import {
  ErrorBanner,
  Loading,
  PageHead,
  StatusBadge,
} from '../components/ui';
import { useAsync } from '../lib/use-async';

export function OfferDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const offer = useAsync(() => api.offers.get(id), [id]);
  const [busy, setBusy] = useState(false);
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
    if (!window.confirm('Delete this offer?')) return;
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
        <IconBack /> Offers
      </button>

      {offer.loading ? (
        <Loading />
      ) : offer.error || !o ? (
        <ErrorBanner message={offer.error ?? 'Offer not found'} />
      ) : (
        <div className="stack">
          <PageHead
            eyebrow={o.number ?? 'Offer'}
            title={o.title ?? o.customerName ?? 'Offer'}
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
                  {s}
                </option>
              ))}
            </select>
          </div>

          {error && <ErrorBanner message={error} />}

          <DocumentView doc={o} />

          <button
            className="btn primary block"
            onClick={generateInvoice}
            disabled={busy}
          >
            <IconInvoice /> {busy ? 'Working…' : 'Generate invoice'}
          </button>
          <button className="btn danger block" onClick={remove} disabled={busy}>
            <IconTrash /> Delete offer
          </button>
        </div>
      )}
    </div>
  );
}

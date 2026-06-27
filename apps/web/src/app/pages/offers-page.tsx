import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { IconOffers, IconPlus } from '../components/icons';
import { OfferFormSheet } from '../components/offer-form';
import {
  EmptyState,
  ErrorBanner,
  Loading,
  Money,
  PageHead,
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
        <OfferFormSheet
          heading="New offer"
          submitLabel="Create offer"
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            const offer = await api.offers.create(values);
            navigate(`/offers/${offer.id}`);
          }}
        />
      )}
    </div>
  );
}

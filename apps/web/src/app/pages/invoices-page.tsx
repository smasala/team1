import { useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { IconInvoice } from '../components/icons';
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

export function InvoicesPage() {
  const navigate = useNavigate();
  const invoices = useAsync(() => api.invoices.list(), []);

  return (
    <div>
      <PageHead eyebrow="Billing" title="Invoices" />

      {invoices.loading ? (
        <Loading />
      ) : invoices.error ? (
        <ErrorBanner message={invoices.error} />
      ) : (invoices.data ?? []).length === 0 ? (
        <EmptyState icon={<IconInvoice />} title="No invoices yet">
          Open an accepted offer and tap “Generate invoice”.
        </EmptyState>
      ) : (
        <div className="stack">
          {(invoices.data ?? []).map((inv) => (
            <button
              key={inv.id}
              className="card tap"
              onClick={() => navigate(`/invoices/${inv.id}`)}
              style={{ textAlign: 'left', color: 'inherit', display: 'block' }}
            >
              <div className="row between">
                <span className="readout tiny faint">{inv.number}</span>
                <StatusBadge status={inv.status} />
              </div>
              <div className="row between" style={{ marginTop: 8 }}>
                <div className="grow">
                  <div className="truncate">
                    {inv.customerName ?? 'Invoice'}
                  </div>
                  <div className="tiny faint">
                    {inv.items.length} items · issued {formatDate(inv.issuedAt)}
                  </div>
                </div>
                <Money value={inv.total} currency={inv.currency} hi />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { INVOICE_STATUSES, type InvoiceStatus } from 'shared-types';
import { api } from '../api/endpoints';
import { DocumentView } from '../components/document-view';
import { IconBack, IconTrash } from '../components/icons';
import { ErrorBanner, Loading, PageHead, StatusBadge } from '../components/ui';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/use-async';

export function InvoiceDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoice = useAsync(() => api.invoices.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inv = invoice.data;

  const setStatus = async (status: InvoiceStatus) => {
    setError(null);
    try {
      await api.invoices.update(id, { status });
      void invoice.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this invoice?')) return;
    setBusy(true);
    try {
      await api.invoices.remove(id);
      navigate('/invoices');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        className="btn ghost sm"
        onClick={() => navigate('/invoices')}
        style={{ marginBottom: 12 }}
      >
        <IconBack /> Invoices
      </button>

      {invoice.loading ? (
        <Loading />
      ) : invoice.error || !inv ? (
        <ErrorBanner message={invoice.error ?? 'Invoice not found'} />
      ) : (
        <div className="stack">
          <PageHead
            eyebrow={inv.number ?? 'Invoice'}
            title={inv.customerName ?? 'Invoice'}
          />

          <div className="row between">
            <StatusBadge status={inv.status} />
            <select
              className="select"
              style={{ width: 'auto' }}
              value={inv.status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="card row between small">
            <div>
              <div className="tiny faint">Issued</div>
              <div className="readout">{formatDate(inv.issuedAt)}</div>
            </div>
            <div>
              <div className="tiny faint">Due</div>
              <div className="readout">{formatDate(inv.dueAt)}</div>
            </div>
            <div>
              <div className="tiny faint">Paid</div>
              <div className="readout">{formatDate(inv.paidAt)}</div>
            </div>
          </div>

          {inv.offerId && (
            <button
              className="btn ghost block"
              onClick={() => navigate(`/offers/${inv.offerId}`)}
            >
              View source offer
            </button>
          )}

          {error && <ErrorBanner message={error} />}

          <DocumentView doc={inv} />

          <button className="btn danger block" onClick={remove} disabled={busy}>
            <IconTrash /> Delete invoice
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvoiceDto } from 'shared-types';
import { api } from '../api/endpoints';
import { IconInvoice, IconPlus } from '../components/icons';
import { LineDraft, LineEditor, toLineInput } from '../components/line-editor';
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
import { useI18n } from '../i18n/i18n';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/use-async';

export function InvoicesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const invoices = useAsync(() => api.invoices.list(), []);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHead
        eyebrow={t('invoices.eyebrow')}
        title={t('invoices.title')}
        action={
          <button className="btn primary sm" onClick={() => setCreating(true)}>
            <IconPlus /> {t('common.new')}
          </button>
        }
      />

      {invoices.loading ? (
        <Loading />
      ) : invoices.error ? (
        <ErrorBanner message={invoices.error} />
      ) : (invoices.data ?? []).length === 0 ? (
        <EmptyState icon={<IconInvoice />} title={t('invoices.empty')}>
          {t('invoices.emptyHint')}
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
                    {inv.customerName ?? t('invoices.fallback')}
                  </div>
                  <div className="tiny faint">
                    {t('common.items', { n: inv.items.length })} ·{' '}
                    {t('invoices.issuedShort', { date: formatDate(inv.issuedAt) })}
                  </div>
                </div>
                <Money value={inv.total} currency={inv.currency} hi />
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <CreateInvoiceSheet
          onClose={() => setCreating(false)}
          onCreated={(inv) => navigate(`/invoices/${inv.id}`)}
        />
      )}
    </div>
  );
}

function CreateInvoiceSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (invoice: InvoiceDto) => void;
}) {
  const { t } = useI18n();
  const [customerName, setCustomerName] = useState('');
  const [taxPct, setTaxPct] = useState('19');
  const [dueAt, setDueAt] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const invoice = await api.invoices.create({
        customerName: customerName || undefined,
        taxRate: (Number(taxPct) || 0) / 100,
        dueAt: dueAt || undefined,
        items: lines.map(toLineInput),
      });
      onCreated(invoice);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <Sheet title={t('invoices.new')} onClose={onClose}>
      <div className="stack">
        {error && <ErrorBanner message={error} />}
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Field label={t('form.customer')}>
            <input
              className="input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>
          <Field label={t('form.vat')}>
            <input
              className="input"
              type="number"
              min={0}
              step="any"
              style={{ width: 90 }}
              value={taxPct}
              onChange={(e) => setTaxPct(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('invoices.dueDate')}>
          <input
            className="input"
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </Field>

        <div className="divider" />
        <div className="eyebrow">{t('form.lineItems')}</div>
        <LineEditor lines={lines} setLines={setLines} />

        <button
          className="btn primary block"
          onClick={save}
          disabled={busy || lines.length === 0}
        >
          {busy ? t('common.creating') : t('invoices.create')}
        </button>
      </div>
    </Sheet>
  );
}

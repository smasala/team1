import { formatMoney, formatPercent } from '../lib/format';
import { Money } from './ui';

interface DocLine {
  id: string;
  description: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface DocLike {
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  items: DocLine[];
}

/** Read-only rendering of an offer/invoice: customer, line items, totals. */
export function DocumentView({ doc }: { doc: DocLike }) {
  const hasCustomer =
    doc.customerName || doc.customerEmail || doc.customerAddress;

  return (
    <div className="stack">
      {hasCustomer && (
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Bill to
          </div>
          {doc.customerName && <div>{doc.customerName}</div>}
          {doc.customerEmail && (
            <div className="small readout muted">{doc.customerEmail}</div>
          )}
          {doc.customerAddress && (
            <div className="small muted">{doc.customerAddress}</div>
          )}
        </div>
      )}

      <div className="card">
        {doc.items.map((li) => (
          <div className="list-row" key={li.id}>
            <div className="grow">
              <div className="small truncate">{li.description}</div>
              <div className="tiny faint readout">
                {li.quantity} × {formatMoney(li.unitPrice, doc.currency)} /{' '}
                {li.unit ?? 'unit'}
              </div>
            </div>
            <span className="money">
              {formatMoney(li.lineTotal, doc.currency)}
            </span>
          </div>
        ))}

        <div className="totals">
          <div className="line">
            <span>Subtotal</span>
            <span className="money">
              {formatMoney(doc.subtotal, doc.currency)}
            </span>
          </div>
          <div className="line">
            <span>VAT {formatPercent(doc.taxRate)}</span>
            <span className="money">
              {formatMoney(doc.taxAmount, doc.currency)}
            </span>
          </div>
          <div className="line grand">
            <span>Total</span>
            <Money value={doc.total} currency={doc.currency} hi />
          </div>
        </div>
      </div>

      {doc.notes && (
        <div className="card small muted">
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Notes
          </div>
          {doc.notes}
        </div>
      )}
    </div>
  );
}

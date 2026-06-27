import { useEffect, type ReactNode } from 'react';
import { useI18n } from '../i18n/i18n';
import { formatMoney } from '../lib/format';

/* ---- Numeric readout ---------------------------------------------------- */

export function Money({
  value,
  currency = 'EUR',
  hi = false,
}: {
  value: number;
  currency?: string;
  hi?: boolean;
}) {
  return (
    <span className={`money${hi ? ' hi' : ''}`}>
      {formatMoney(value, currency)}
    </span>
  );
}

/* ---- Status badge ------------------------------------------------------- */

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${status.toLowerCase()}`}>{t(`status.${status}`)}</span>
  );
}

/* ---- Loading / error / empty ------------------------------------------- */

export const Spinner = () => {
  const { t } = useI18n();
  return <div className="spinner" aria-label={t('common.loading')} />;
};

export const Loading = () => (
  <div className="center-load">
    <Spinner />
  </div>
);

export const ErrorBanner = ({ message }: { message: string }) => (
  <div className="banner-error" role="alert">
    {message}
  </div>
);

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon && <div className="ico">{icon}</div>}
      <h3>{title}</h3>
      {children && <div className="small">{children}</div>}
    </div>
  );
}

/* ---- Form field --------------------------------------------------------- */

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function PageHead({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div className="row between">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
        </div>
        {action}
      </div>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

/* ---- Bottom sheet modal ------------------------------------------------- */

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grip" />
        <h2 style={{ marginBottom: 14 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

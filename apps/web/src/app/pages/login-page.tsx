import { useState } from 'react';
import { useAuth } from '../auth/auth-context';
import { ErrorBanner } from '../components/ui';

/** Auth gate. Single action: open the seeded test workspace (dev Supabase auth). */
export function LoginPage() {
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await login();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="shell">
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '32px 24px calc(40px + env(safe-area-inset-bottom))',
          gap: 22,
        }}
      >
        <div
          className="brand"
          style={{ fontSize: 22, gap: 12, alignItems: 'center' }}
        >
          <span className="bug" style={{ width: 34, height: 34, fontSize: 18 }}>
            F
          </span>
          FeldPro
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Field quoting tool
          </div>
          <h1 style={{ fontSize: 38, lineHeight: 1.05 }}>
            Quote the job
            <br />
            before you leave
            <br />
            the site.
          </h1>
          <p className="muted" style={{ marginTop: 14, fontSize: 15 }}>
            Build offers and invoices from a priced trade catalogue — or just
            describe the work and let the assistant draft it for you.
          </p>
        </div>

        <ul
          className="readout small"
          style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--muted)' }}
        >
          {[
            '2,869 catalogue items, priced',
            'Offers → invoices in one tap',
            'Talk or type to draft a quote',
          ].map((t) => (
            <li
              key={t}
              style={{ display: 'flex', gap: 10, padding: '4px 0' }}
            >
              <span style={{ color: 'var(--hi)' }}>▸</span>
              {t}
            </li>
          ))}
        </ul>

        {error && <ErrorBanner message={error} />}

        <button className="btn primary block" onClick={signIn} disabled={busy}>
          {busy ? 'Opening…' : 'Open test workspace'}
        </button>
        <p className="tiny faint" style={{ textAlign: 'center', margin: 0 }}>
          Signs in as the seeded Supabase test account.
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../auth/auth-context';
import { ErrorBanner, Field } from '../components/ui';
import { useI18n } from '../i18n/i18n';

/** Auth gate. Supabase email/password when configured, else the dev workspace. */
export function LoginPage() {
  const { mode, signIn } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
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
            {t('login.eyebrow')}
          </div>
          <h1 style={{ fontSize: 38, lineHeight: 1.05 }}>
            {t('login.headline')}
          </h1>
          <p className="muted" style={{ marginTop: 14, fontSize: 15 }}>
            {t('login.subtitle')}
          </p>
        </div>

        <ul
          className="readout small"
          style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--muted)' }}
        >
          {[
            t('login.feature1'),
            t('login.feature2'),
            t('login.feature3'),
          ].map((feature) => (
            <li
              key={feature}
              style={{ display: 'flex', gap: 10, padding: '4px 0' }}
            >
              <span style={{ color: 'var(--hi)' }}>▸</span>
              {feature}
            </li>
          ))}
        </ul>

        {mode === 'supabase' && (
          <div className="stack">
            <Field label={t('common.email')}>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={t('login.passwordLabel')}>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </Field>
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        <button className="btn primary block" onClick={submit} disabled={busy}>
          {busy
            ? t('login.signingIn')
            : mode === 'supabase'
              ? t('login.signIn')
              : t('login.openWorkspace')}
        </button>
        <p className="tiny faint" style={{ textAlign: 'center', margin: 0 }}>
          {mode === 'supabase' ? t('login.supabaseNote') : t('login.devNote')}
        </p>
      </div>
    </div>
  );
}

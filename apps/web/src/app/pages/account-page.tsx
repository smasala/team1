import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { IconChevron, IconLogout, IconUser } from '../components/icons';
import { PageHead } from '../components/ui';
import { LANGS, useI18n } from '../i18n/i18n';

export function AccountPage() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  return (
    <div>
      <PageHead eyebrow={t('account.eyebrow')} title={t('account.title')} />

      <div className="card stack">
        <div>
          <div className="tiny faint">{t('common.name')}</div>
          <div>{user?.fullName ?? '—'}</div>
        </div>
        <div className="divider" />
        <div>
          <div className="tiny faint">{t('common.email')}</div>
          <div className="readout small">{user?.email ?? '—'}</div>
        </div>
        <div className="divider" />
        <div>
          <div className="tiny faint">{t('common.role')}</div>
          <div>{user?.role ? t(`role.${user.role}`) : '—'}</div>
        </div>
        <div className="divider" />
        <div>
          <div className="tiny faint">{t('account.organisation')}</div>
          <div className="readout tiny truncate">{user?.organisationId}</div>
        </div>
        <div className="divider" />
        <div>
          <div className="tiny faint">{t('account.userId')}</div>
          <div className="readout tiny truncate">{user?.id}</div>
        </div>
      </div>

      <div className="field" style={{ marginTop: 18 }}>
        <span>{t('account.language')}</span>
        <select
          className="input"
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="card tap row between"
        onClick={() => navigate('/team')}
        style={{
          width: '100%',
          marginTop: 14,
          textAlign: 'left',
          color: 'inherit',
        }}
      >
        <span className="row" style={{ gap: 10, alignItems: 'center' }}>
          <IconUser /> {t('account.team')}
        </span>
        <IconChevron />
      </button>

      <button
        className="btn danger block"
        style={{ marginTop: 18 }}
        onClick={logout}
      >
        <IconLogout /> {t('account.signOut')}
      </button>
    </div>
  );
}

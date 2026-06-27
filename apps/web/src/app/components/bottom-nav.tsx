import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/i18n';
import {
  IconAI,
  IconCatalogue,
  IconInvoice,
  IconOffers,
  IconUser,
} from './icons';

const tab =
  (accent = false) =>
  ({ isActive }: { isActive: boolean }) =>
    `tab${accent ? ' accent' : ''}${isActive ? ' active' : ''}`;

/** Fixed bottom tab bar. The center tab is the AI assistant (the hero). */
export function BottomNav() {
  const { t } = useI18n();
  return (
    <nav className="tabbar">
      <NavLink to="/catalogue" className={tab()}>
        <IconCatalogue />
        <span>{t('nav.catalogue')}</span>
      </NavLink>
      <NavLink to="/offers" className={tab()}>
        <IconOffers />
        <span>{t('nav.offers')}</span>
      </NavLink>
      <NavLink
        to="/assistant"
        className={tab(true)}
        aria-label={t('nav.assistant')}
      >
        <span className="fab">
          <IconAI />
        </span>
      </NavLink>
      <NavLink to="/invoices" className={tab()}>
        <IconInvoice />
        <span>{t('nav.invoices')}</span>
      </NavLink>
      <NavLink to="/account" className={tab()}>
        <IconUser />
        <span>{t('nav.account')}</span>
      </NavLink>
    </nav>
  );
}

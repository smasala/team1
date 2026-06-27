import { NavLink } from 'react-router-dom';
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
  return (
    <nav className="tabbar">
      <NavLink to="/catalogue" className={tab()}>
        <IconCatalogue />
        <span>Catalogue</span>
      </NavLink>
      <NavLink to="/offers" className={tab()}>
        <IconOffers />
        <span>Offers</span>
      </NavLink>
      <NavLink to="/assistant" className={tab(true)} aria-label="Assistant">
        <span className="fab">
          <IconAI />
        </span>
      </NavLink>
      <NavLink to="/invoices" className={tab()}>
        <IconInvoice />
        <span>Invoices</span>
      </NavLink>
      <NavLink to="/account" className={tab()}>
        <IconUser />
        <span>Account</span>
      </NavLink>
    </nav>
  );
}

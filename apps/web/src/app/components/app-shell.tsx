import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { BottomNav } from './bottom-nav';

/** Mobile shell: sticky brand bar + scrollable content + bottom tab bar. */
export function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.fullName ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="bug">F</span>
          FeldPro
          <small>v0.1</small>
        </div>
        <button
          className="brand"
          onClick={() => navigate('/account')}
          aria-label="Account"
          style={{
            border: 'none',
            background: 'var(--surface-2)',
            width: 34,
            height: 34,
            borderRadius: 9,
            color: 'var(--hi)',
            cursor: 'pointer',
            justifyContent: 'center',
          }}
        >
          {initial}
        </button>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}

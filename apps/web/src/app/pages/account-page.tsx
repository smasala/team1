import { useAuth } from '../auth/auth-context';
import { IconLogout } from '../components/icons';
import { PageHead } from '../components/ui';

export function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <PageHead eyebrow="Signed in" title="Account" />

      <div className="card stack">
        <div>
          <div className="tiny faint">Name</div>
          <div>{user?.fullName ?? '—'}</div>
        </div>
        <div className="divider" />
        <div>
          <div className="tiny faint">Email</div>
          <div className="readout small">{user?.email ?? '—'}</div>
        </div>
        <div className="divider" />
        <div>
          <div className="tiny faint">User ID</div>
          <div className="readout tiny truncate">{user?.id}</div>
        </div>
      </div>

      <button
        className="btn danger block"
        style={{ marginTop: 18 }}
        onClick={logout}
      >
        <IconLogout /> Sign out
      </button>
    </div>
  );
}

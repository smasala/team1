import { useState } from 'react';
import type { TeamMemberDto, UserRole } from 'shared-types';
import { useAuth } from '../auth/auth-context';
import { api } from '../api/endpoints';
import { IconPlus, IconTrash, IconUser } from '../components/icons';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  PageHead,
  Sheet,
} from '../components/ui';
import { useI18n } from '../i18n/i18n';
import { useAsync } from '../lib/use-async';

/** Manage organisation members (team). Mutations are admin-only. */
export function TeamPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const members = useAsync<TeamMemberDto[]>(() => api.team.list(), []);
  const [editing, setEditing] = useState<TeamMemberDto | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHead
        eyebrow={t('team.eyebrow')}
        title={t('team.title')}
        subtitle={t('team.subtitle')}
        action={
          isAdmin ? (
            <button
              className="btn primary sm"
              onClick={() => setCreating(true)}
            >
              <IconPlus /> {t('team.add')}
            </button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <p className="tiny faint" style={{ marginBottom: 12 }}>
          {t('team.adminOnly')}
        </p>
      )}

      {members.loading ? (
        <Loading />
      ) : members.error ? (
        <ErrorBanner message={members.error} />
      ) : (members.data ?? []).length === 0 ? (
        <EmptyState icon={<IconUser />} title={t('team.empty')}>
          {t('team.emptyHint')}
        </EmptyState>
      ) : (
        <div className="card" style={{ padding: '4px 14px' }}>
          {(members.data ?? []).map((m) => (
            <button
              key={m.id}
              className="list-row"
              onClick={() => isAdmin && setEditing(m)}
              disabled={!isAdmin}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--line)',
                color: 'inherit',
                textAlign: 'left',
                cursor: isAdmin ? 'pointer' : 'default',
              }}
            >
              <div className="grow">
                <div className="small truncate">
                  {m.fullName || m.email || '—'}
                  {m.id === user?.id && (
                    <span className="tiny faint"> · {t('team.you')}</span>
                  )}
                </div>
                <div className="tiny faint readout truncate">{m.email}</div>
              </div>
              <span className={`badge ${m.role.toLowerCase()}`}>
                {t(`role.${m.role}`)}
              </span>
            </button>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <MemberSheet
          member={editing ?? undefined}
          isSelf={editing?.id === user?.id}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            void members.reload();
          }}
        />
      )}
    </div>
  );
}

/** Create or edit a team member. */
function MemberSheet({
  member,
  isSelf,
  onClose,
  onSaved,
}: {
  member?: TeamMemberDto;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState(member?.email ?? '');
  const [fullName, setFullName] = useState(member?.fullName ?? '');
  const [role, setRole] = useState<UserRole>(member?.role ?? 'EMPLOYEE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (member) await api.team.update(member.id, { fullName, role });
      else await api.team.create({ email, fullName, role });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const del = async () => {
    if (!member) return;
    setBusy(true);
    setError(null);
    try {
      await api.team.remove(member.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <Sheet title={member ? t('team.edit') : t('team.new')} onClose={onClose}>
      <div className="stack">
        {error && <ErrorBanner message={error} />}
        <Field label={t('common.email')}>
          <input
            className="input"
            type="email"
            value={email}
            disabled={!!member}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t('common.name')}>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
        <Field label={t('common.role')}>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="EMPLOYEE">{t('role.EMPLOYEE')}</option>
            <option value="ADMIN">{t('role.ADMIN')}</option>
          </select>
        </Field>

        <button
          className="btn primary block"
          onClick={save}
          disabled={busy || (!member && !email)}
        >
          {busy ? t('common.saving') : t('common.save')}
        </button>
        {member && !isSelf && (
          <button className="btn danger block" onClick={del} disabled={busy}>
            <IconTrash /> {t('common.delete')}
          </button>
        )}
      </div>
    </Sheet>
  );
}

import { useEffect, useState } from 'react';
import type { HealthStatus } from 'shared-types';
import { fetchHealth } from './api-client';

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 480,
        margin: '0 auto',
        padding: '2rem',
      }}
    >
      <h1>team1</h1>
      <p>Nx · React · NestJS · Prisma (SQLite, Supabase-ready)</p>

      <section>
        <h2>API health</h2>
        {error && <p style={{ color: 'crimson' }}>Cannot reach API: {error}</p>}
        {!error && !health && <p>Checking…</p>}
        {health && (
          <ul>
            <li>
              status: <strong>{health.status}</strong>
            </li>
            <li>
              db: <strong>{health.db}</strong>
            </li>
            <li>
              notes: <strong>{health.notes}</strong>
            </li>
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;

/**
 * Wire contract for GET /api/health. Imported by both the API (response shape)
 * and the web app (fetch result) — defined once, never duplicated.
 */
export interface HealthStatus {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  /** Number of Note rows — proves a real DB read went through. */
  notes: number;
  timestamp: string;
}

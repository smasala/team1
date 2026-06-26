import type { HealthStatus } from 'shared-types';

// Single thin boundary to the API. Base URL is env-driven (never hardcode hosts).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) {
    throw new Error(`API responded ${res.status}`);
  }
  return (await res.json()) as HealthStatus;
}

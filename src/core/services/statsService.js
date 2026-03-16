import apiClient from '@/core/api/apiClient.js';

/**
 * Fetch online player count from the backend.
 * Public endpoint, no auth required.
 * Returns 0 on failure (graceful degradation).
 */
export async function getOnlinePlayersCount() {
  try {
    const data = await apiClient.get('/stats/online');
    return data?.online || 0;
  } catch {
    return 0;
  }
}

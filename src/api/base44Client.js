import mockBase44 from './base44Client.mock';

const useFake = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_USE_FAKE_DB === 'true' || import.meta.env?.VITE_USE_FAKE_DB === '1')) || process.env.USE_FAKE_DB === '1';

export let base44 = mockBase44;

// Helper for talking to a local express API instead of the Base44 SDK
export const apiBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4000';
import axios from 'axios';
export const apiClient = axios.create({ baseURL: apiBaseUrl });

// Lazy-init real SDK client if not using fake DB.  the app still
// prefers the hosted Base44 service by default; if you want to use
// your own backend set VITE_USE_FAKE_DB=true and then call the
// endpoints on `apiClient` directly from components.
if (!useFake) {
  (async () => {
    const { createClient } = await import('@base44/sdk');
    const { appParams } = await import('@/lib/app-params');
    const { appId, serverUrl, token, functionsVersion } = appParams;
    base44 = createClient({ appId, serverUrl, token, functionsVersion, requiresAuth: false });
  })().catch(err => console.error('Failed to init base44 SDK:', err));
}


import mockBase44 from './base44Client.mock';
import expressBase44 from './expressClient';

const useFake = (typeof import.meta !== 'undefined' &&
  (import.meta.env?.VITE_USE_FAKE_DB === 'true' || import.meta.env?.VITE_USE_FAKE_DB === '1'));

// Use mock DB for tests/offline, otherwise use Express backend
export let base44 = useFake ? mockBase44 : expressBase44;

// Keep apiClient for any direct calls in components
export const apiBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

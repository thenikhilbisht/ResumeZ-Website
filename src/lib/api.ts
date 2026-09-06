/**
 * Robust API Client utility for ResumeZ
 * Handles safe auth header injection, error parsing, and fallback formatting.
 */

const metaEnv = (import.meta as any).env || {};

export const VITE_API_URL = metaEnv.VITE_API_URL ? String(metaEnv.VITE_API_URL).replace(/\/$/, '') : '';

export function getApiUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!VITE_API_URL) return path;
  return `${VITE_API_URL}${path}`;
}

export function getAuthHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : getApiUrl(url);
  try {
    const res = await fetch(fullUrl, {
      ...options,
      credentials: options.credentials || 'same-origin',
    });
    return res;
  } catch (err: any) {
    throw new Error(
      err?.message || `Unable to reach Railway backend API at ${fullUrl}. Please check your connection.`
    );
  }
}

export async function safeFetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await safeFetch(url, options);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server returned a non-JSON response (status ${res.status}). Please try again.`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

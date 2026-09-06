/**
 * Robust API Client utility for ResumeZ
 * Handles safe auth header injection, error parsing, and fallback formatting.
 */

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
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    throw new Error(err?.message || 'Network connection error. Please check your internet connection or retry.');
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

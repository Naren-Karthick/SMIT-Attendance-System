/**
 * Unified Safe API Fetch Client
 * Guarantees that HTML responses (500, 504, 404) or network errors NEVER
 * throw "Unexpected token '<', '<!DOCTYPE'" syntax errors.
 */

export async function safeApiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('smit_token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options?.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const trimmed = text.trim();

  // Guard against HTML error pages returned by Vercel or Express
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<?xml')
  ) {
    if (res.status === 504 || trimmed.includes('504 Gateway Time-out') || trimmed.includes('FUNCTION_INVOCATION_TIMEOUT')) {
      throw new Error('Cloud server request timed out. Please try again.');
    }
    if (res.status === 413 || trimmed.includes('Request Entity Too Large')) {
      throw new Error('Upload payload exceeds server limits. Please upload a smaller photo or compressed document.');
    }
    throw new Error(`Server returned an HTML error (HTTP ${res.status}). Service may be initializing, please try again.`);
  }

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    if (res.status === 413 || text.includes('Request Entity Too Large')) {
      throw new Error('Upload payload exceeds server limit. Please upload a smaller file.');
    }
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

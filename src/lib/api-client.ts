/**
 * Centralized Academic API Client for AISE Lab Studio
 * 
 * Handles authenticated API requests seamlessly across both:
 * 1. Standard browser sessions (via HttpOnly cookies)
 * 2. Embedded preview environments (via Bearer token authorization fallback)
 */

const TOKEN_STORAGE_KEY = 'aise_auth_token';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        this.token = null;
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined' && window.localStorage) {
      try {
        this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        // LocalStorage access may be restricted in sandboxed iframe
      }
    }
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch {
        // Fall back to memory only
      }
    }
  }

  clearToken(): void {
    this.setToken(null);
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});

    // Include credentials for browser cookie support
    const fetchOptions: RequestInit = {
      ...options,
      credentials: options.credentials || 'include',
    };

    // Attach Bearer token as fallback for iframe / preview contexts
    const currentToken = this.getToken();
    if (currentToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    fetchOptions.headers = headers;

    const response = await fetch(url, fetchOptions);

    // If server returned 401 and we had a token, it might be expired
    if (response.status === 401) {
      console.warn(`[ApiClient] 401 Unauthorized for ${url}`);
    }

    return response;
  }

  async get<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await this.fetch(url, { ...options, method: 'GET' });
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch {
        // ignore
      }
      const err = new Error(errorMsg) as any;
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  async post<T = any>(url: string, body?: any, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    let bodyPayload = body;

    if (body !== undefined && !(body instanceof FormData) && typeof body !== 'string') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      bodyPayload = JSON.stringify(body);
    }

    const res = await this.fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: bodyPayload,
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch {
        // ignore
      }
      const err = new Error(errorMsg) as any;
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  async put<T = any>(url: string, body?: any, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    let bodyPayload = body;

    if (body !== undefined && !(body instanceof FormData) && typeof body !== 'string') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      bodyPayload = JSON.stringify(body);
    }

    const res = await this.fetch(url, {
      ...options,
      method: 'PUT',
      headers,
      body: bodyPayload,
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch {
        // ignore
      }
      const err = new Error(errorMsg) as any;
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  async delete<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await this.fetch(url, { ...options, method: 'DELETE' });
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch {
        // ignore
      }
      const err = new Error(errorMsg) as any;
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();
export const apiFetch = (url: string, options?: RequestInit) => apiClient.fetch(url, options);

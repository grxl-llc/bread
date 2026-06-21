/**
 * breadClient.js — Drop-in replacement for base44Client.
 *
 * Mirrors the exact same API surface:
 *   client.auth.me()
 *   client.auth.updateMe(data)
 *   client.auth.logout()
 *   client.auth.redirectToLogin(returnUrl)
 *   client.entities.{EntityName}.list(sort, limit)
 *   client.entities.{EntityName}.filter(filters, sort, limit)
 *   client.entities.{EntityName}.get(id)
 *   client.entities.{EntityName}.create(data)
 *   client.entities.{EntityName}.update(id, data)
 *   client.entities.{EntityName}.delete(id)
 *   client.integrations.Core.UploadFile({ file })
 *   client.integrations.Core.InvokeLLM({ prompt, response_json_schema })
 *   client.integrations.Core.SendEmail({ to, subject, body })
 */

import { API_BASE_URL } from '@/lib/apiConfig';

const BASE = API_BASE_URL || '';

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'bread_access_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.detail || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

const auth = {
  async me() {
    return request('GET', '/api/auth/me');
  },

  async updateMe(data) {
    return request('PATCH', '/api/auth/me', data);
  },

  async signUp(email, password, fullName, zipcode) {
    const res = await request('POST', '/api/auth/signup', {
      email, password, full_name: fullName, zipcode,
    });
    if (res?.token) setToken(res.token);
    return res;
  },

  async signIn(email, password) {
    const res = await request('POST', '/api/auth/signin', { email, password });
    if (res?.token) setToken(res.token);
    return res;
  },

  logout(returnUrl) {
    clearToken();
    const dest = returnUrl || '/signin';
    window.location.href = dest;
  },

  redirectToLogin(returnUrl) {
    clearToken();
    window.location.href = `/signin${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ''}`;
  },

  isAuthenticated() {
    return !!getToken();
  },
};

// ── Entity builder ────────────────────────────────────────────────────────────

function buildEntity(entityName) {
  const base = `/api/entities/${entityName}`;

  return {
    async list(sort = '-created_date', limit = 50) {
      const params = new URLSearchParams({ sort, limit });
      return request('GET', `${base}?${params}`);
    },

    async filter(filters = {}, sort = '-created_date', limit = 50) {
      const params = new URLSearchParams({ sort, limit });
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== null && v !== undefined) params.append(k, v);
      });
      return request('GET', `${base}?${params}`);
    },

    async get(id) {
      return request('GET', `${base}/${id}`);
    },

    async create(data) {
      return request('POST', base, data);
    },

    async update(id, data) {
      return request('PUT', `${base}/${id}`, data);
    },

    async delete(id) {
      return request('DELETE', `${base}/${id}`);
    },
  };
}

// Proxy so any entity name works: client.entities.Post, client.entities.Tutorial, etc.
const entities = new Proxy({}, {
  get(_, entityName) {
    return buildEntity(entityName);
  },
});

// ── Integrations ──────────────────────────────────────────────────────────────

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const form = new FormData();
      form.append('file', file);
      return request('POST', '/api/upload', form, true);
    },

    async InvokeLLM({ prompt, response_json_schema }) {
      return request('POST', '/api/llm/invoke', { prompt, response_json_schema });
    },

    async SendEmail({ to, subject, body: emailBody }) {
      // Email via SES — stubbed until SES is configured
      console.warn('SendEmail called — configure SES to enable:', { to, subject });
      return { ok: true };
    },
  },
};

// ── Live streaming ────────────────────────────────────────────────────────────

const live = {
  async startStream(title, description = '', category = '') {
    return request('POST', '/api/live/start', { title, description, category });
  },

  async endStream(tutorialId) {
    return request('POST', `/api/live/${tutorialId}/end`);
  },

  async getChatToken(tutorialId) {
    return request('GET', `/api/live/${tutorialId}/chat-token`);
  },

  async getActiveStreams() {
    return request('GET', '/api/live/active');
  },
};

// ── Pricing ───────────────────────────────────────────────────────────────────

const pricing = {
  async search(query, zipCode, limit = 10) {
    const params = new URLSearchParams({ query, zip_code: zipCode, limit });
    return request('GET', `/api/pricing/search?${params}`);
  },

  async compare(items, zipCode) {
    const params = new URLSearchParams({ items: items.join(','), zip_code: zipCode });
    return request('GET', `/api/pricing/compare?${params}`);
  },

  async stores(zipCode, radius = 35) {
    const params = new URLSearchParams({ zip_code: zipCode, radius });
    return request('GET', `/api/pricing/stores?${params}`);
  },

  async deals(zipCode, limit = 12, broad = false) {
    const params = new URLSearchParams({ zip_code: zipCode, limit, broad });
    return request('GET', `/api/pricing/deals?${params}`);
  },

  // Live cheapest-package recipe cost on the proven search path. Pantry items
  // (with quantities) are deducted from what needs to be bought.
  async recipeCost(ingredients, zipCode, pantryItems = []) {
    return request('POST', '/api/pricing/recipe-cost', {
      ingredients,
      zip_code: zipCode,
      pantry_items: pantryItems,
    });
  },
};

// ── App logs (no-op stub) ─────────────────────────────────────────────────────
// Base44 had a usage-analytics surface (appLogs). We don't track that yet, so
// these are safe no-ops that return a resolved promise to satisfy callers.
const appLogs = {
  async logUserInApp() { return null; },
};

// ── Exported client ───────────────────────────────────────────────────────────

export const breadClient = { auth, entities, integrations, live, pricing, appLogs };

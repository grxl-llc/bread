/**
 * API Configuration
 *
 * Set API_BASE_URL to control where all data requests go:
 *   - Leave as "" (empty string) to use the default Base44 backend
 *   - Set to your FastAPI base URL (e.g. "https://api.myapp.com") to proxy all requests there
 *
 * When pointing to a FastAPI backend, your server must implement the same
 * entity REST interface:
 *   GET    /entities/{EntityName}
 *   POST   /entities/{EntityName}
 *   GET    /entities/{EntityName}/{id}
 *   PUT    /entities/{EntityName}/{id}
 *   DELETE /entities/{EntityName}/{id}
 */

// Env-driven so the SAME build runs locally, on the web host, and inside the
// iOS/Android (Capacitor) app — each environment just sets VITE_API_BASE_URL.
//   • local dev:  defaults to http://localhost:8000
//   • hosted/app: set VITE_API_BASE_URL=https://api.yourdomain.com
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
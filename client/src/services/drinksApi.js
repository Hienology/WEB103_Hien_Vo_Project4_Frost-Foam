function inferApiBase() {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    if (hostname.endsWith('.app.github.dev')) {
      const forwardedHost = hostname.replace(/-\d+\.app\.github\.dev$/, '-3001.app.github.dev')
      return `${protocol}//${forwardedHost}/api`
    }
  }

  return 'http://localhost:3001/api'
}

const envApiBase = import.meta.env.VITE_API_URL?.trim() || ''
const isCodespacesHost =
  typeof window !== 'undefined' && window.location.hostname.endsWith('.app.github.dev')

const API_BASE =
  isCodespacesHost && envApiBase === 'http://localhost:3001/api'
    ? inferApiBase()
    : envApiBase || inferApiBase()

async function request(path, options = {}) {
  const method = options.method || 'GET'
  const url = `${API_BASE}${path}`
  let response
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch (cause) {
    const details = cause instanceof Error && cause.message ? ` Details: ${cause.message}` : ''
    throw new Error(
      `Unable to reach the backend server (${method} ${url}). Check API server status and port forwarding for 3001.${details}`
    )
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload?.error ||
      payload?.message ||
      `Request failed (${response.status} ${response.statusText}) while calling ${method} ${url}.`
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const apiConfig = {
  baseUrl: API_BASE,
}

export const drinksApi = {
  list: () => request('/drinks'),
  get: (id) => request(`/drinks/${id}`),
  create: (payload) =>
    request('/drinks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/drinks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/drinks/${id}`, {
      method: 'DELETE',
    }),
}

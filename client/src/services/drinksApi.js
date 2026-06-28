const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Request failed.')
  }

  if (response.status === 204) return null
  return response.json()
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

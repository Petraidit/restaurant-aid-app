// In Docker/prod, this is set via an env var at build time (VITE_API_URL).
// Locally it falls back to the backend running on port 8000.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export const api = {
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  items: () => request('/items'),
  addItem: (token, item) => request('/items', { method: 'POST', body: item, token }),
  placeOrder: (token, order) => request('/orders', { method: 'POST', body: order, token }),
  myOrders: (token) => request('/orders/mine', { token }),
  allOrders: (token) => request('/orders', { token }),
  setStatus: (token, id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: { status }, token }),
}

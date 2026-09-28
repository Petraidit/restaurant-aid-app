import { useEffect, useState } from 'react'
import { api } from './api'

function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const data = mode === 'login'
        ? await api.login(email, password)
        : await api.register(name, email, password)
      onAuthed(data)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
      {mode === 'register' && (
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      )}
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      {error && <p className="error">{error}</p>}
      <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
      </button>
    </form>
  )
}

function CustomerView({ token }) {
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [note, setNote] = useState('')

  const load = () => {
    api.items().then(setItems)
    api.myOrders(token).then(setOrders)
  }
  useEffect(() => { load() }, [token])

  async function order(itemId) {
    await api.placeOrder(token, { item_id: itemId, quantity: 1, note })
    setNote('')
    load()
  }

  return (
    <div>
      <section className="section">
        <h2>Menu</h2>
        <div className="grid">
          {items.map((it) => (
            <div key={it.id} className="card item-card">
              <div className="item-top">
                <strong>{it.name}</strong>
                <span className="price">₦{it.price}</span>
              </div>
              <p className="muted">{it.description}</p>
              <button onClick={() => order(it.id)}>Order</button>
            </div>
          ))}
          {items.length === 0 && <p className="empty">No items yet — ask the admin to add some.</p>}
        </div>
      </section>

      <section className="section">
        <h2>Your orders</h2>
        {orders.length === 0 ? (
          <p className="empty">You haven't placed an order yet.</p>
        ) : (
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.item_name}</td><td>{o.quantity}</td><td>₦{o.total}</td>
                  <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function AdminView({ token }) {
  const [orders, setOrders] = useState([])
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const statuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled']

  const load = () => api.allOrders(token).then(setOrders)
  useEffect(() => { load() }, [token])

  async function addItem(e) {
    e.preventDefault()
    await api.addItem(token, { ...form, price: Number(form.price) })
    setForm({ name: '', description: '', price: '' })
    alert('Item added')
  }

  async function changeStatus(id, status) {
    await api.setStatus(token, id, status)
    load()
  }

  return (
    <div>
      <section className="section">
        <h2>Add a menu item</h2>
        <form onSubmit={addItem} className="card form-row">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <button type="submit">Add item</button>
        </form>
      </section>

      <section className="section">
        <h2>All orders</h2>
        {orders.length === 0 ? (
          <p className="empty">No orders yet.</p>
        ) : (
          <table>
            <thead><tr><th>Customer</th><th>Item</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.customer}</td><td>{o.item_name}</td><td>{o.quantity}</td><td>₦{o.total}</td>
                  <td>
                    <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(null)

  if (!auth) {
    return (
      <div className="app auth-screen">
        <div className="brand">
          <div className="logo">RA</div>
          <h1>Restaurant Aid</h1>
          <p className="tagline">Orders and bookings, sorted.</p>
        </div>
        <AuthForm onAuthed={setAuth} />
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <div className="brand-row">
          <div className="logo">RA</div>
          <h1>Restaurant Aid</h1>
        </div>
        <div className="header-right">
          <span className="who">Hi, {auth.name} {auth.is_admin && <span className="admin-tag">admin</span>}</span>
          <button className="link" onClick={() => setAuth(null)}>Log out</button>
        </div>
      </header>
      {auth.is_admin ? <AdminView token={auth.token} /> : <CustomerView token={auth.token} />}
    </div>
  )
}

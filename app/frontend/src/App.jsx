import Landing from './Landing'
import { useEffect, useRef, useState, createContext, useContext } from 'react'
import { api } from './api'

/* ---------- toast system ---------- */
const ToastContext = createContext(() => {})
let toastId = 0

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function push(message, type = 'default') {
    const id = ++toastId
    setToasts((t) => [...t, { id, message, type, leaving: false }])
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 250)
    }, 2600)
  }

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type} ${t.leaving ? 'leaving' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
const useToast = () => useContext(ToastContext)

/* ---------- small icons (inline, no deps) ---------- */
const PlateIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" />
  </svg>
)
const InboxIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 10l2-6h14l2 6" /><path d="M3 10v8a1 1 0 001 1h16a1 1 0 001-1v-8" />
    <path d="M3 10h5a1 1 0 011 1 2 2 0 002 2h2a2 2 0 002-2 1 1 0 011-1h5" />
  </svg>
)
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

/* ---------- welcome modal ---------- */
function WelcomeModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(onClose, 5000)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey) }
  }, [open])

  if (!open) return null

  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-close" onClick={onClose} aria-label="Close">×</button>
        <p className="welcome-text">GET IN JOOR</p>
        <div className="welcome-bar"><div className="welcome-bar-fill" /></div>
      </div>
    </div>
  )
}

/* ---------- auth ---------- */
function AuthForm({ onAuthed, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = mode === 'login'
        ? await api.login(email, password)
        : await api.register(name, email, password)
      onAuthed(data)
    } catch (err) {
      setError(err.message)
      setShake(true)
      setTimeout(() => setShake(false), 400)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={`card ${shake ? 'shake' : ''}`}>
      <h2 style={{ margin: 0, fontSize: 19, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
        {mode === 'login' ? 'Log in' : 'Create account'}
      </h2>
      {mode === 'register' && (
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      )}
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>
        {busy && <span className="spinner" />}
        {mode === 'login' ? 'Log in' : 'Register'}
      </button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
      </button>
    </form>
  )
}

/* ---------- customer ---------- */
function CustomerView({ token }) {
  const [items, setItems] = useState(null)
  const [orders, setOrders] = useState(null)
  const [qty, setQty] = useState({})
  const [bump, setBump] = useState({})
  const [orderingId, setOrderingId] = useState(null)
  const [justOrdered, setJustOrdered] = useState(null)
  const toast = useToast()

  const load = () => {
    api.items().then(setItems)
    api.myOrders(token).then(setOrders)
  }
  useEffect(() => { load() }, [token])

  function changeQty(id, delta) {
    setQty((q) => ({ ...q, [id]: Math.max(1, (q[id] || 1) + delta) }))
    setBump((b) => ({ ...b, [id]: true }))
    setTimeout(() => setBump((b) => ({ ...b, [id]: false })), 220)
  }

  async function order(item) {
    setOrderingId(item.id)
    try {
      await api.placeOrder(token, { item_id: item.id, quantity: qty[item.id] || 1, note: '' })
      setOrderingId(null)
      setJustOrdered(item.id)
      toast(`${item.name} added to your order`, 'success')
      setTimeout(() => setJustOrdered(null), 1200)
      api.myOrders(token).then(setOrders)
    } catch (err) {
      setOrderingId(null)
      toast(err.message, 'error')
    }
  }

  return (
    <div>
      <section className="section">
        <h2>Menu</h2>
        {items === null ? (
          <div className="grid">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton sk-card" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty"><PlateIcon /><span>No items yet — ask the admin to add some.</span></div>
        ) : (
          <div className="grid">
            {items.map((it) => (
              <div key={it.id} className="card item-card">
                <div className="item-top">
                  <strong>{it.name}</strong>
                  <span className="price">₦{it.price}</span>
                </div>
                <p className="muted">{it.description}</p>
                <div className="qty-row">
                  <div className="stepper">
                    <button type="button" onClick={() => changeQty(it.id, -1)} aria-label="Decrease quantity">−</button>
                    <span className={bump[it.id] ? 'bump' : ''}>{qty[it.id] || 1}</span>
                    <button type="button" onClick={() => changeQty(it.id, 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <button
                    onClick={() => order(it)}
                    disabled={orderingId === it.id}
                    className={orderingId === it.id ? 'ordering' : justOrdered === it.id ? 'ordered' : ''}
                  >
                    {orderingId === it.id ? (
                      <><span className="spinner" /> Ordering</>
                    ) : justOrdered === it.id ? (
                      <span className="check-pop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check /> Added</span>
                    ) : 'Order'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Your orders</h2>
        {orders === null ? (
          <div><div className="skeleton sk-row" /><div className="skeleton sk-row" /></div>
        ) : orders.length === 0 ? (
          <div className="empty"><InboxIcon /><span>You haven't placed an order yet.</span></div>
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

/* ---------- admin ---------- */
function AdminView({ token }) {
  const [orders, setOrders] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [adding, setAdding] = useState(false)
  const [pulseId, setPulseId] = useState(null)
  const statuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled']
  const toast = useToast()

  const load = () => api.allOrders(token).then(setOrders)
  useEffect(() => { load() }, [token])

  async function addItem(e) {
    e.preventDefault()
    setAdding(true)
    try {
      await api.addItem(token, { ...form, price: Number(form.price) })
      toast(`${form.name} added to the menu`, 'success')
      setForm({ name: '', description: '', price: '' })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  async function changeStatus(id, status) {
    await api.setStatus(token, id, status)
    setPulseId(id)
    setTimeout(() => setPulseId(null), 400)
    toast(`Order #${id} marked ${status}`)
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
          <button type="submit" disabled={adding}>{adding && <span className="spinner" />} Add item</button>
        </form>
      </section>

      <section className="section">
        <h2>All orders</h2>
        {orders === null ? (
          <div><div className="skeleton sk-row" /><div className="skeleton sk-row" /></div>
        ) : orders.length === 0 ? (
          <div className="empty"><InboxIcon /><span>No orders yet.</span></div>
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
                    <span className={`badge ${o.status} ${pulseId === o.id ? 'pulse' : ''}`} style={{ marginLeft: 8 }}>{o.status}</span>
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

/* ---------- app shell ---------- */
function Shell() {
  const [auth, setAuthState] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('auth')) || null
    } catch {
      return null
    }
  })
  const [showWelcome, setShowWelcome] = useState(false)
  const [view, setView] = useState('landing')
  const [authMode, setAuthMode] = useState('login')

  const setAuth = (value) => {
    if (value) sessionStorage.setItem('auth', JSON.stringify(value))
    else sessionStorage.removeItem('auth')
    setAuthState(value)
  }

  function handleAuthed(data) {
    setAuth(data)
    setShowWelcome(true)
  }

  function handleLogout() {
    setAuth(null)
    setView('landing')
  }

  if (!auth && view === 'landing') {
    return (
      <Landing
        onLogin={() => { setAuthMode('login'); setView('auth') }}
        onRegister={() => { setAuthMode('register'); setView('auth') }}
      />
    )
  }

  if (!auth) {
    return (
      <div className="app auth-screen">
        <div className="brand">
          <div className="logo">RA</div>
          <h1>Restaurant Aid</h1>
          <p className="tagline">Orders and bookings, sorted.</p>
        </div>
        <AuthForm key={authMode} initialMode={authMode} onAuthed={handleAuthed} />
        <button className="link" onClick={() => setView('landing')}>← Back to home</button>
        <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
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
          <button className="link" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      {auth.is_admin ? <AdminView token={auth.token} /> : <CustomerView token={auth.token} />}
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
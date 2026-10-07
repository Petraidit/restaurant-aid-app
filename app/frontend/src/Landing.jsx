import { useEffect, useRef } from 'react'
import './landing.css'

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.15 }
    )
    items.forEach((i) => io.observe(i))
    return () => io.disconnect()
  }, [])
  return ref
}

const FEATURES = [
  { icon: '🍽️', title: 'Browse the menu', text: 'See what is cooking today, with prices up front.' },
  { icon: '⚡', title: 'Order in seconds', text: 'Pick your dishes, add a note, and send it to the kitchen.' },
  { icon: '📍', title: 'Track every order', text: 'Watch your order move from received to ready.' },
]

export default function Landing({ onLogin, onRegister }) {
  const ref = useReveal()

  return (
    <div className="landing" ref={ref}>
      <nav className="l-nav">
        <div className="l-brand">
          <div className="l-logo">RA</div>
          <span>Restaurant Aid</span>
        </div>
        <div className="l-nav-actions">
          <button className="l-btn l-btn-ghost" onClick={onLogin}>Log in</button>
          <button className="l-btn l-btn-primary" onClick={onRegister}>Register</button>
        </div>
      </nav>

      <header className="l-hero">
        <div className="l-hero-copy">
          <span className="l-pill">Orders and bookings, sorted.</span>
          <h1>Good food, <em>zero queue.</em></h1>
          <p>
            Browse the menu, place your order, and follow it from kitchen to table.
            Restaurant owners manage everything from one simple dashboard.
          </p>
          <div className="l-cta-row">
            <button className="l-btn l-btn-primary l-btn-lg" onClick={onRegister}>
              Get started <span className="l-arrow">→</span>
            </button>
            <button className="l-btn l-btn-ghost l-btn-lg" onClick={onLogin}>
              I already have an account
            </button>
          </div>
        </div>

        <div className="l-hero-art" aria-hidden="true">
          <div className="l-card l-card-a"><span>🍛</span><b>Jollof Rice</b><small>Ready in 12 min</small></div>
          <div className="l-card l-card-b"><span>🍗</span><b>Grilled Chicken</b><small>Order received</small></div>
          <div className="l-card l-card-c"><span>🥗</span><b>Garden Salad</b><small>Ready</small></div>
        </div>
      </header>

      <section className="l-features">
        {FEATURES.map((f, i) => (
          <div className="l-feature reveal" style={{ transitionDelay: `${i * 90}ms` }} key={f.title}>
            <div className="l-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <section className="l-final reveal">
        <h2>Ready to place your first order?</h2>
        <button className="l-btn l-btn-primary l-btn-lg" onClick={onRegister}>
          Create your account <span className="l-arrow">→</span>
        </button>
      </section>

      <footer className="l-footer">© Restaurant Aid</footer>
    </div>
  )
}
import { JSX, useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './auth.css'

type LoginResponse = { token?: string; error?: string }

export default function Login(): JSX.Element {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const navigate = useNavigate()
  const bounceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = bounceRef.current
    if (!layer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // clear any previous
    layer.innerHTML = ''

    const W = () => layer.clientWidth
    const H = () => layer.clientHeight
    const N = 18
    const MIN = 14, MAX = 22

    type Coin = { el: HTMLSpanElement; x: number; y: number; vx: number; vy: number; s: number }
    const coins: Coin[] = []

    for (let i = 0; i < N; i++) {
      const s = MIN + Math.random() * (MAX - MIN)
      const span = document.createElement('span')
      span.className = 'coin'
      span.style.width = `${s}px`
      span.style.height = `${s}px`
      layer.appendChild(span)

      const x = Math.random() * (W() - s)
      const y = Math.random() * (H() - s)
      const speed = 40 + Math.random() * 80 // px/s
      const ang = Math.random() * Math.PI * 2
      const vx = Math.cos(ang) * speed
      const vy = Math.sin(ang) * speed

      coins.push({ el: span, x, y, vx, vy, s })
    }

    let raf = 0
    let last = performance.now()
    const step = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000) // clamp dt
      last = t

      const w = W(), h = H()
      for (const c of coins) {
        c.x += c.vx * dt
        c.y += c.vy * dt

        // bounce off walls
        if (c.x <= 0) { c.x = 0; c.vx *= -1 }
        if (c.x + c.s >= w) { c.x = w - c.s; c.vx *= -1 }
        if (c.y <= 0) { c.y = 0; c.vy *= -1 }
        if (c.y + c.s >= h) { c.y = h - c.s; c.vy *= -1 }

        // tiny random drift to avoid sync
        c.vx += (Math.random() - 0.5) * 2
        c.vy += (Math.random() - 0.5) * 2

        c.el.style.transform = `translate(${c.x}px, ${c.y}px)`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    const ro = new ResizeObserver(() => { /* recalc happens each frame */ })
    ro.observe(layer)

    return () => { cancelAnimationFrame(raf); ro.disconnect(); layer.innerHTML = '' }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data: LoginResponse = await res.json()
      if (!res.ok || !data.token) {
        setError(data.error || 'Invalid credentials')
      } else {
        localStorage.setItem('token', data.token)
        // stay on landing; user goes to tracker only from Start tracking
        navigate('/')  // <- was '/app'
      }
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <div className="brand">
            X<span>P</span>
          </div>

          <h1 className="title">Sign in</h1>
          <p className="subtitle">Access your account to track expenses.</p>

          <div className="or">sign in using username</div>

          <form onSubmit={handleSubmit} className="form">
            <label className="input">
              <span>😏</span>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="input">
              <span>🫣</span>
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {error && <div className="error">{error}</div>}

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Continue →'}
            </button>
          </form>

          <div className="footnote">
            New here? <Link to="/register">Sign up</Link>
          </div>
        </div>

        <div className="auth-right">
          <div className="blob" />
          <div className="cash-flow" ref={bounceRef} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
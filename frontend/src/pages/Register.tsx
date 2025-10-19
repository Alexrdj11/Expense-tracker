import { JSX, useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../lib/api'
import './auth.css'

export default function Register(): JSX.Element {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirm, setConfirm] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const bounceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = bounceRef.current
    if (!layer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    layer.innerHTML = ''
    const W = () => layer.clientWidth
    const H = () => layer.clientHeight
    const N = 18, MIN = 14, MAX = 22

    type Coin = { el: HTMLSpanElement; x: number; y: number; vx: number; vy: number; s: number }
    const coins: Coin[] = []

    for (let i = 0; i < N; i++) {
      const s = MIN + Math.random() * (MAX - MIN)
      const el = document.createElement('span')
      el.className = 'coin'
      el.style.width = `${s}px`
      el.style.height = `${s}px`
      layer.appendChild(el)

      const x = Math.random() * (W() - s)
      const y = Math.random() * (H() - s)
      const speed = 40 + Math.random() * 80
      const a = Math.random() * Math.PI * 2
      coins.push({ el, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, s })
    }

    let raf = 0, last = performance.now()
    const step = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000)
      last = t
      const w = W(), h = H()
      for (const c of coins) {
        c.x += c.vx * dt; c.y += c.vy * dt
        if (c.x <= 0) { c.x = 0; c.vx *= -1 }
        if (c.x + c.s >= w) { c.x = w - c.s; c.vx *= -1 }
        if (c.y <= 0) { c.y = 0; c.vy *= -1 }
        if (c.y + c.s >= h) { c.y = h - c.s; c.vy *= -1 }
        c.vx += (Math.random() - 0.5) * 2
        c.vy += (Math.random() - 0.5) * 2
        c.el.style.transform = `translate(${c.x}px, ${c.y}px)`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    const ro = new ResizeObserver(() => {})
    ro.observe(layer)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); layer.innerHTML = '' }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await apiFetch<void>('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      {
        await login(username, password) // auto sign-in
        navigate('/') // <- was '/app'
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
          <div className="brand">expense<span>tracker</span></div>
          <h1 className="title">Sign up</h1>
          <p className="subtitle">Create an account to start tracking expenses.</p>

          <div className="or">or sign up using username</div>

          <form onSubmit={handleSubmit} className="form">
            <label className="input">
              <span>@</span>
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
              <span>••</span>
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="input">
              <span>••</span>
              <input
                type="password"
                placeholder="confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            {error && <div className="error">{error}</div>}

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Continue →'}
            </button>
          </form>

          <div className="footnote">
            Already have an account? <Link to="/login">Sign in</Link>
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

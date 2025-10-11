import { JSX, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './landing.css'

export default function XP(): JSX.Element {
  const featuresRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const goTrack = () => {
    const token = localStorage.getItem('token')
    nav(token ? '/app' : '/login')
  }
  const goFeatures = () => featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const onDownload = () => {
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 1600)
  }

  return (
    <div className="xp-wrap">
      {/* Page 1: Black & white banner */}
      <section className="xp-hero-bw">
        <div
          className={`bw-nav ${menuOpen ? 'open' : ''}`}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            className="hamburger"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
          >
            <span /><span /><span />
          </button>

          <div className="hover-menu">
            <button
              className="menu-item"
              onClick={() => { setMenuOpen(false); goTrack() }}
              type="button"
            >
              Start tracking →
            </button>
            <button
              className="menu-item"
              onClick={() => { setMenuOpen(false); goFeatures() }}
              type="button"
            >
              About
            </button>
          </div>
        </div>

        <div className="bw-center">
          <h1 className="brand-title">XP</h1>
          <div className="brand-sub">EXPENSE TRACKER</div>

          <button className="scroll-hint" onClick={goFeatures} aria-label="Scroll to features">
            ↓
          </button>
        </div>

        <div className="bw-right-social" aria-hidden="true">
          <span>•</span><span>•</span><span>•</span>
        </div>
      </section>

      {/* Page 2: Features */}
      <section className="xp-features" ref={featuresRef} id="features">
        <div className="container features-head">
          <h2>What you get</h2>
          <button className="btn-primary" onClick={goTrack} type="button">Start tracking →</button>
        </div>

        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <div className="icon">📊</div>
              <h3>Smart Analytics</h3>
              <p>Visual insights and trends powered by data‑driven models.</p>
            </div>
            <div className="feature">
              <div className="icon">🔐</div>
              <h3>End‑to‑End Privacy</h3>
              <p>Zero third‑party sharing — your data stays encrypted.</p>
            </div>
            <div className="feature">
              <div className="icon">🛰️</div>
              <h3>Cross‑Platform Sync</h3>
              <p>Access your tracker anywhere, anytime.</p>
            </div>
            <div className="feature">
              <div className="icon">🎯</div>
              <h3>Budget Goals</h3>
              <p>Monthly targets, reminders, and progress streaks.</p>
            </div>
          </div>
        </div>

        {/* Callout with Download button */}
        <div className="container get-started">
          <h3>Get Started with XP</h3>
          <p>Track your expenses and manage your budget effectively.</p>
          <button className="btn-primary" onClick={onDownload} type="button">Download the app →</button>
        </div>
      </section>

      <footer className="xp-footer">Developed by Harsha • version: v0.01</footer>

      {/* Tiny toast */}
      <div className={`toast ${showToast ? 'show' : ''}`}>uhmm 👉👈 coming soon</div>
    </div>
  )
}
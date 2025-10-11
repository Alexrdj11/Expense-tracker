import { JSX, PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import '../pages/app.css'

export default function AppShell({ children }: PropsWithChildren): JSX.Element {
  const { logout } = useAuth()
  const nav = useNavigate()
  return (
    <div className="app-wrap">
      <header className="app-topbar">
        <div className="brand" onClick={() => nav('/')} style={{ cursor: 'pointer' }}>XP</div>
        <div className="spacer" />
        <button className="btn-outline" onClick={() => nav('/import')}>Import</button>
        <button className="btn-outline" onClick={logout}>Logout</button>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
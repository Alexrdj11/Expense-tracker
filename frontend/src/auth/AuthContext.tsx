import { createContext, useContext, useEffect, useState } from 'react'

type AuthCtx = {
  token: string | null
  login: (username: string, password: string) => Promise<boolean> // changed to boolean
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok || !data?.token) throw new Error(data?.error || 'Login failed')
    localStorage.setItem('token', data.token)
    setToken(data.token)
    return true
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  return <Ctx.Provider value={{ token, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

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
    const data = await apiFetch<{ token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    )
    if (!data?.token) throw new Error('Login failed')
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
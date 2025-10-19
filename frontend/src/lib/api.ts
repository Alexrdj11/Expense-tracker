export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // Use Vercel/production base when provided; keep dev proxy in local
  const base = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || '')
  const url = base ? new URL(path, base).toString() : path

  const res = await fetch(url, { ...options, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.error || data?.message || 'Request failed')
  return data as T
}
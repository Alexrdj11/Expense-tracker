import { useState } from 'react'
import { apiFetch } from '../lib/api'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (cat: { id: number; name: string }) => void
}

export default function AddCategoryModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = await apiFetch<{ id: number; name: string }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      onCreated(saved)
      setName('')
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Create category</h3>
        <form onSubmit={submit} className="modal-form">
          <label className="field">
            <span>Name</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
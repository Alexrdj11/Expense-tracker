import { JSX, useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import { apiFetch } from '../lib/api'
import AddCategoryModal from '../components/AddCategoryModal'
import RangeBarChart from '../components/RangeBarChart'
import './app.css'

type Category = { id: number; name: string }
type Expense = {
  id: number
  description: string
  amount: number
  categoryId: number
  expenseDate: string
}

export default function Expenses(): JSX.Element {
  const [cats, setCats] = useState<Category[]>([])
  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [showCat, setShowCat] = useState(false)
  // add range state
  const [range, setRange] = useState<15 | 30 | 90>(30)
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const [c, e] = await Promise.all([
          apiFetch<Category[]>('/api/categories'),
          apiFetch<Expense[]>('/api/expenses'),
        ])
        if (!cancelled) {
          setCats(c)
          setItems(e)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const from = fromDate
    const to = toDate
    return items.filter(i => {
      const k = i.expenseDate.slice(0, 10)
      return k >= from && k <= to
    })
  }, [items, fromDate, toDate])

  const total = useMemo(
    () => filtered.reduce((sum, x) => sum + Number(x.amount || 0), 0),
    [filtered]
  )

  function setPreset(days: 15 | 30 | 90) {
    setRange(days)
    const today = new Date()
    const to = today.toISOString().slice(0, 10)
    const start = new Date(today); start.setDate(today.getDate() - (days - 1))
    const from = start.toISOString().slice(0, 10)
    setFromDate(from); setToDate(to)
  }

  async function createExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!categoryId) { setError('Pick a category'); return }
    setSaving(true)
    try {
      const payload = {
        description,
        amount: Number(amount),
        categoryId: Number(categoryId),
        expenseDate,
      }
      const saved = await apiFetch<Expense>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setItems((prev) => [saved, ...prev])
      setDescription('')
      setAmount('')
      // keep same category/date
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function removeExpense(id: number) {
    try {
      await apiFetch<void>(`/api/expenses/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (e: any) {
      setError(e.message || 'Delete failed')
    }
  }

  return (
    <AppShell>
      <AddCategoryModal
        open={showCat}
        onClose={() => setShowCat(false)}
        onCreated={(c) => {
          setCats((prev) => [c, ...prev])
          setCategoryId(c.id)
        }}
      />

      <section className="pane">
        <div className="pane-left">
          <h1 className="headline">Track your spending</h1>
          <p className="sub">Add an expense and see it reflected instantly.</p>

          <form className="grid" onSubmit={createExpense}>
            <label className="field">
              <span>Description</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Coffee, Uber, Groceries..."
                required
              />
            </label>

            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label className="field">
              <span>Category</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  style={{ flex: 1 }}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Select category</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" className="btn-outline" onClick={() => setShowCat(true)}>
                  + Add
                </button>
              </div>
            </label>

            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </label>

            {error && <div className="error">{error}</div>}

            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add expense'}
            </button>
          </form>

          <div className="summary">
            <div className="card">
              <div className="label">Total</div>
              <div className="value">₹ {total.toFixed(2)}</div>
            </div>
          </div>

          {/* Range selector + chart */}
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-outline" onClick={() => setPreset(15)} style={{ borderColor: range === 15 ? '#7c3aed' : undefined }}>15 days</button>
              <button className="btn-outline" onClick={() => setPreset(30)} style={{ borderColor: range === 30 ? '#7c3aed' : undefined }}>30 days</button>
              <button className="btn-outline" onClick={() => setPreset(90)} style={{ borderColor: range === 90 ? '#7c3aed' : undefined }}>90 days</button>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="field" style={{ minWidth: 160 }}>
                  <span>From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      const v = e.target.value
                      setFromDate(v)
                      if (v > toDate) setToDate(v)
                    }}
                  />
                </label>
                <label className="field" style={{ minWidth: 160 }}>
                  <span>To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      const v = e.target.value
                      setToDate(v)
                      if (v < fromDate) setFromDate(v)
                    }}
                  />
                </label>
              </div>
            </div>

            <RangeBarChart items={filtered} startDate={fromDate} endDate={toDate} />
          </div>
        </div>

        <div className="pane-right">
          <h2 className="list-title">Recent expenses</h2>
          {/* Recent expenses list */}
          {loading ? (
            <div className="muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="muted">No expenses for selected range</div>
          ) : (
            <ul className="list">
              {filtered.map((x) => (
                <li key={x.id} className="row">
                  <div className="col grow">
                    <div className="desc">{x.description}</div>
                    <div className="meta">
                      <span>{new Date(x.expenseDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Cat #{x.categoryId}</span>
                    </div>
                  </div>
                  <div className="col amount">₹ {Number(x.amount).toFixed(2)}</div>
                  <button className="col link danger" onClick={() => removeExpense(x.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  )
}
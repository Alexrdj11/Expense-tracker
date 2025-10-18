import { JSX, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import './app.css'

type Result = { imported: number; failed: number; skipped?: number; errors: { line: number; error: string }[] }

export default function Import(): JSX.Element {
  const navigate = useNavigate()
  const [pdf, setPdf] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [previewLines, setPreviewLines] = useState<string[] | null>(null)

  async function uploadPdf(preview = false) {
    if (!pdf) return
    setBusy(true); setError(''); setRes(null); setPreviewLines(null)
    try {
      const token = localStorage.getItem('token') || ''
      const form = new FormData()
      form.append('file', pdf)
      const r = await fetch(`/api/expenses/import/pdf?preview=${preview ? 'true' : 'false'}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || 'Import failed')
      if (preview && data?.lines) setPreviewLines(data.lines as string[])
      else setRes(data as Result)
    } catch (e: any) {
      setError(e.message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="pane" style={{ gridTemplateColumns: '1fr' }}>
        <div className="pane-left">
          <h2>Import expenses (PDF)</h2>
          <p className="sub">Upload text-based bank statements (date, description, amount). Scanned PDFs are not supported yet.</p>

          <div className="field">
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} />
          </div>

          {error && <div className="error">{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn-primary" onClick={() => uploadPdf(false)} disabled={!pdf || busy}>
              {busy ? 'Uploading...' : 'Upload & import PDF'}
            </button>
            <button className="btn-outline" onClick={() => uploadPdf(true)} disabled={!pdf || busy}>
              Preview text
            </button>
          </div>

          {res && (
            <div style={{ marginTop: 12 }}>
              <div className="card">Imported: {res.imported} • Failed: {res.failed} • Skipped: {res.skipped ?? 0}</div>
              {res.errors.length > 0 && (
                <ul className="list" style={{ marginTop: 8 }}>
                  {res.errors.map((e, i) => (
                    <li key={i} className="row">
                      <div className="col grow">Line {e.line}</div>
                      <div className="col">{e.error}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: 12, display: 'flex' }}>
                <button className="btn-primary" onClick={() => navigate('/app')}>
                  let's goo
                </button>
              </div>
            </div>
          )}
          {previewLines && (
            <div className="card" style={{ marginTop: 12, maxHeight: 280, overflow: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Preview (first lines)</div>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{previewLines.join('\n')}</pre>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
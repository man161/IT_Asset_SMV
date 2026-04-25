import { useState, useRef } from 'react'
import api from '../lib/api'
import { Button, Card, PageHeader, Spinner } from '../components/ui'
import toast from 'react-hot-toast'

interface PreviewData {
  summary: { total_assets: number; total_history: number; assets_with_employee: number }
  assets: any[]
  history: any[]
  errors: string[]
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [imported, setImported] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'assets' | 'history'>('assets')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error('Chỉ hỗ trợ file .xlsx hoặc .xls')
      return
    }
    setFile(f)
    setPreview(null)
    setImported(null)
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/import/preview', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreview(data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Lỗi đọc file')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!file) return
    if (!confirm(`Xác nhận import ${preview?.summary.total_assets} tài sản và ${preview?.summary.total_history} lịch sử vào hệ thống?`)) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/import/confirm', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      })
      setImported(data)
      toast.success('Import thành công!')
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Lỗi import')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setFile(null); setPreview(null); setImported(null) }

  return (
    <div>
      <PageHeader title="Import Excel" subtitle="Migration dữ liệu tài sản từ file Excel" />

      {/* Upload zone */}
      {!preview && !imported && (
        <Card style={{ marginBottom: 20 }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--border-2)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--blue-bg)' : 'transparent',
              transition: 'all .2s',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>
              {file ? file.name : 'Kéo thả file Excel vào đây'}
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'hoặc click để chọn file (.xlsx, .xls)'}
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
          </div>

          {file && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <Button variant="ghost" onClick={reset}>✕ Bỏ file</Button>
              <Button onClick={handlePreview} disabled={loading}>
                {loading ? 'Đang đọc...' : '👁 Xem trước dữ liệu'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {loading && <Spinner />}

      {/* Preview */}
      {preview && !imported && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              ['Tổng tài sản', preview.summary.total_assets, 'var(--blue)'],
              ['Có bàn giao', preview.summary.assets_with_employee, 'var(--green)'],
              ['Lịch sử thay đổi', preview.summary.total_history, 'var(--amber)'],
            ].map(([label, val, color]) => (
              <Card key={label as string} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: color as string }}>{val as number}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{label as string}</div>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {(['assets', 'history'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '7px 16px', borderRadius: 'var(--radius)',
                background: activeTab === t ? 'var(--blue)' : 'var(--bg-3)',
                color: activeTab === t ? '#fff' : 'var(--text-2)',
                border: '1px solid', borderColor: activeTab === t ? 'var(--blue)' : 'var(--border)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>
                {t === 'assets' ? `Tài sản (${preview.assets.length})` : `Lịch sử (${preview.history.length})`}
              </button>
            ))}
          </div>

          <Card style={{ padding: 0, marginBottom: 20, maxHeight: 400, overflowY: 'auto' }}>
            {activeTab === 'assets' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-2)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Dòng', 'Mã máy', 'Loại', 'Serial', 'Vendor', 'OS/Win', 'Nhân viên', 'Phòng ban', 'Ngày BG'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.assets.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '7px 12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{a.row}</td>
                      <td style={{ padding: '7px 12px', fontWeight: 500 }}>{a.asset_code}</td>
                      <td style={{ padding: '7px 12px', color: 'var(--text-2)' }}>{a.device_type || '—'}</td>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{a.serial_number || '—'}</td>
                      <td style={{ padding: '7px 12px', color: 'var(--text-2)' }}>{a.vendor || '—'}</td>
                      <td style={{ padding: '7px 12px', color: 'var(--text-2)' }}>{a.os || '—'} / {a.windows_version || '—'}</td>
                      <td style={{ padding: '7px 12px' }}>
                        {a.emp_code ? <span style={{ color: 'var(--blue)' }}>{a.full_name}<br/><span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>{a.emp_code}</span></span> : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ padding: '7px 12px', color: 'var(--text-2)', fontSize: 11 }}>{a.dept || '—'}</td>
                      <td style={{ padding: '7px 12px', color: 'var(--text-2)', fontSize: 11 }}>{a.setting_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-2)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Dòng', 'Ngày', 'Mã máy', 'Nhân viên', 'Lý do'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '7px 12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{h.row}</td>
                      <td style={{ padding: '7px 12px', color: 'var(--text-2)' }}>{h.date || '—'}</td>
                      <td style={{ padding: '7px 12px', fontWeight: 500 }}>{h.pc_name}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ color: 'var(--blue)' }}>{h.full_name}</span>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginLeft: 6 }}>{h.emp_code}</span>
                      </td>
                      <td style={{ padding: '7px 12px', color: 'var(--text-2)' }}>{h.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {preview.errors.length > 0 && (
            <Card style={{ marginBottom: 16, background: 'var(--red-dim)', border: '1px solid var(--red)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 8 }}>⚠ {preview.errors.length} cảnh báo</div>
              {preview.errors.slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text-2)' }}>{e}</div>)}
            </Card>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={reset}>← Chọn file khác</Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Đang import...' : `✓ Xác nhận import ${preview.summary.total_assets} tài sản`}
            </Button>
          </div>
        </>
      )}

      {/* Result */}
      {imported && (
        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--green)' }}>✓ Import hoàn tất</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              ['Tài sản tạo mới', imported.assets_created, 'var(--green)'],
              ['Tài sản bỏ qua', imported.assets_skipped, 'var(--text-2)'],
              ['Nhân viên tạo mới', imported.employees_created, 'var(--blue)'],
              ['Nhân viên cập nhật', imported.employees_updated, 'var(--purple)'],
              ['Bàn giao tạo', imported.assignments_created, 'var(--green)'],
              ['Lịch sử tạo', imported.history_created, 'var(--amber)'],
            ].map(([label, val, color]) => (
              <div key={label as string} style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: color as string }}>{val as number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{label as string}</div>
              </div>
            ))}
          </div>
          {imported.errors?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 6 }}>⚠ {imported.errors.length} lỗi bỏ qua:</div>
              {imported.errors.slice(0, 10).map((e: string, i: number) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{e}</div>
              ))}
            </div>
          )}
          <Button variant="ghost" onClick={reset}>Import file khác</Button>
        </Card>
      )}
    </div>
  )
}

import { CSSProperties, ReactNode } from 'react'
import clsx from 'clsx'

// ── Badge ──────────────────────────────────────────────────────
const badgeColors: Record<string, [string, string]> = {
  available:   ['var(--green)', 'var(--green-dim)'],
  assigned:    ['var(--blue)', 'var(--blue-dim)'],
  maintenance: ['var(--amber)', 'var(--amber-dim)'],
  disposed:    ['var(--text-3)', 'var(--bg-4)'],
  active:      ['var(--green)', 'var(--green-dim)'],
  returned:    ['var(--text-2)', 'var(--bg-4)'],
  revoked:     ['var(--red)', 'var(--red-dim)'],
  inactive:    ['var(--amber)', 'var(--amber-dim)'],
  resigned:    ['var(--text-3)', 'var(--bg-4)'],
}

const badgeLabels: Record<string, string> = {
  available: 'Có sẵn', assigned: 'Đang dùng', maintenance: 'Bảo trì', disposed: 'Thanh lý',
  active: 'Hoạt động', returned: 'Đã trả', revoked: 'Thu hồi',
  inactive: 'Ngừng', resigned: 'Nghỉ việc',
}

export function Badge({ status }: { status: string }) {
  const [fg, bg] = badgeColors[status] ?? ['var(--text-2)', 'var(--bg-4)']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99,
      fontSize: 12, fontWeight: 500,
      color: fg, background: bg,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: fg, flexShrink: 0 }} />
      {badgeLabels[status] ?? status}
    </span>
  )
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ label, value, color, icon }: { label: string; value: number | string; color?: string; icon?: string }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: color ?? 'var(--text-1)', letterSpacing: '-1px' }}>{value}</div>
    </Card>
  )
}

// ── Button ─────────────────────────────────────────────────────
interface BtnProps {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'; disabled?: boolean; type?: 'button' | 'submit'
  style?: CSSProperties
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style }: BtnProps) {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 'var(--radius)', fontWeight: 500, border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
    fontSize: size === 'sm' ? 12 : 13.5,
    padding: size === 'sm' ? '5px 11px' : '8px 16px',
    transition: 'all .15s',
  }
  const variants: Record<string, CSSProperties> = {
    primary: { background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' },
    ghost:   { background: 'var(--bg-3)', color: 'var(--text-2)', borderColor: 'var(--border)' },
    danger:  { background: 'var(--red-dim)', color: 'var(--red)', borderColor: 'var(--red-dim)' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────────────
interface InputProps {
  label?: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean; min?: string
}

export function Input({ label, value, onChange, placeholder, type = 'text', required }: InputProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}{required && <span style={{ color: 'var(--red)' }}> *</span>}</span>}
      <input
        type={type} value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '8px 11px',
          color: 'var(--text-1)', fontSize: 13.5, outline: 'none',
          width: '100%',
        }}
      />
    </label>
  )
}

// ── Select ─────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, required }: {
  label?: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}{required && <span style={{ color: 'var(--red)' }}> *</span>}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} style={{
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '8px 11px',
        color: 'var(--text-1)', fontSize: 13.5, outline: 'none', width: '100%',
      }}>
        <option value="">— Chọn —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

// ── Table ──────────────────────────────────────────────────────
export function Table({ headers, children, empty }: {
  headers: string[]; children: ReactNode; empty?: boolean
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 14px',
                color: 'var(--text-3)', fontWeight: 500,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr><td colSpan={headers.length} style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Không có dữ liệu</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  )
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} style={{
      borderBottom: '1px solid var(--border)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background .1s',
    }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
    >{children}</tr>
  )
}

export function Td({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <td style={{ padding: '11px 14px', color: 'var(--text-1)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
      {children}
    </td>
  )
}

// ── Modal ──────────────────────────────────────────────────────
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 520,
        boxShadow: 'var(--shadow-lg)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--text-2)', fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Page Header ────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-2)', fontSize: 13.5, marginTop: 3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Search ─────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 14 }}>⌕</span>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '8px 12px 8px 30px',
          color: 'var(--text-1)', fontSize: 13.5, outline: 'none', width: 240,
        }}
      />
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 16 }}>
      <Button variant="ghost" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>‹</Button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onPage(p)} style={{
          width: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 500,
          background: p === page ? 'var(--blue)' : 'var(--bg-3)',
          color: p === page ? '#fff' : 'var(--text-2)',
          border: '1px solid', borderColor: p === page ? 'var(--blue)' : 'var(--border)',
          cursor: 'pointer',
        }}>{p}</button>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>›</Button>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon?: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      {icon && <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>}
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid var(--border)', borderTopColor: 'var(--blue)',
        animation: 'spin .7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

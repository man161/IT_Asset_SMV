import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch {
      toast.error('Sai tên đăng nhập hoặc mật khẩu')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      {/* BG decoration */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, #1d3461 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: 36,
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--blue)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff',
          }}>IT</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>ITAM System</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Quản lý tài sản IT nội bộ</div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Đăng nhập</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 24 }}>Nhập thông tin tài khoản để tiếp tục</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Tên đăng nhập</span>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin" required autoFocus
              style={{
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '9px 12px',
                color: 'var(--text-1)', fontSize: 14, outline: 'none',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Mật khẩu</span>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '9px 12px',
                color: 'var(--text-1)', fontSize: 14, outline: 'none',
              }}
            />
          </label>
          <button type="submit" disabled={loading} style={{
            marginTop: 6, padding: '10px', borderRadius: 'var(--radius)',
            background: 'var(--blue)', border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? .7 : 1,
          }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
          </button>
        </form>
      </div>
    </div>
  )
}

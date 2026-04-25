import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

const NAV = [
  { to: '/dashboard',   icon: '▦',  label: 'Dashboard' },
  { to: '/assets',      icon: '⊞',  label: 'Tài sản' },
  { to: '/employees',   icon: '◉',  label: 'Nhân viên' },
  { to: '/assignments', icon: '⇄',  label: 'Bàn giao' },
  { to: '/catalog',     icon: '≡',  label: 'Danh mục' },
  { to: '/import',      icon: '↑',  label: 'Import Excel' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)', flexShrink: 0,
        background: 'var(--bg-2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '0',
      }}>
        {/* Logo */}
        <div style={{
          height: 'var(--header-h)', display: 'flex', alignItems: 'center',
          padding: '0 20px', borderBottom: '1px solid var(--border)',
          gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--blue)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff',
          }}>IT</div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>ITAM</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--radius)',
              color: isActive ? 'var(--text-1)' : 'var(--text-2)',
              background: isActive ? 'var(--bg-4)' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              fontSize: 13.5, transition: 'all .15s',
              textDecoration: 'none',
            })}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{
          borderTop: '1px solid var(--border)', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--purple-dim)', border: '1px solid var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: 'var(--purple)',
          }}>
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }} className="truncate">{user?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{user?.is_admin ? 'Admin' : 'Viewer'}</div>
          </div>
          <button onClick={logout} style={{
            background: 'none', border: 'none', color: 'var(--text-3)',
            fontSize: 16, padding: 4, borderRadius: 6, lineHeight: 1,
          }} title="Đăng xuất">⏻</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { DashboardStats, Asset } from '../types'
import { StatCard, Card, Badge, Spinner } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  })

  const { data: warrantyAssets } = useQuery<Asset[]>({
    queryKey: ['warranty-expiring'],
    queryFn: () => api.get('/assets/stats/warranty-expiring?days=30').then(r => r.data),
  })

  const { data: recentAssets } = useQuery<{ items: Asset[] }>({
    queryKey: ['recent-assets'],
    queryFn: () => api.get('/assets?size=5').then(r => r.data),
  })

  if (isLoading) return <Spinner />

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13.5, marginTop: 3 }}>Tổng quan hệ thống quản lý tài sản IT</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Tổng tài sản"     value={stats?.total_assets ?? 0}        icon="⊞" />
        <StatCard label="Có sẵn"           value={stats?.available_assets ?? 0}    color="var(--green)" icon="✓" />
        <StatCard label="Đang sử dụng"     value={stats?.assigned_assets ?? 0}     color="var(--blue)"  icon="◉" />
        <StatCard label="Bảo trì"          value={stats?.maintenance_assets ?? 0}  color="var(--amber)" icon="⚙" />
        <StatCard label="Nhân viên"        value={stats?.total_employees ?? 0}      icon="人" />
        <StatCard label="Bàn giao đang mở" value={stats?.active_assignments ?? 0}  color="var(--purple)" icon="⇄" />
        <StatCard label="Bảo hành sắp hết" value={stats?.warranty_expiring_soon ?? 0} color="var(--red)" icon="⚠" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Warranty warning */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--amber)' }}>⚠</span> Bảo hành sắp hết (30 ngày)
          </h3>
          {!warrantyAssets?.length ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Không có tài sản nào sắp hết bảo hành</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {warrantyAssets.slice(0, 5).map(a => (
                <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 'var(--radius)', background: 'var(--amber-dim)',
                  cursor: 'pointer',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{a.asset_code}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--amber)' }}>
                    {a.warranty_expiry ? format(new Date(a.warranty_expiry), 'dd/MM/yyyy') : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent assets */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Tài sản mới nhập</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentAssets?.items.map(a => (
              <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 'var(--radius)',
                background: 'var(--bg-3)', cursor: 'pointer',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{a.brand} {a.model}</div>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

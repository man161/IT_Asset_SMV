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

  const { data: warrantyExpiring } = useQuery<Asset[]>({
    queryKey: ['warranty-expiring'],
    queryFn: () => api.get('/assets/stats/warranty-expiring?days=30').then(r => r.data),
  })

  const { data: warrantyExpired } = useQuery<Asset[]>({
    queryKey: ['warranty-expired'],
    queryFn: () => api.get('/assets/stats/warranty-expired').then(r => r.data),
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

      {/* Stats grid — bỏ "Bàn giao đang mở", thêm "Hết bảo hành" */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Tổng tài sản"      value={stats?.total_assets ?? 0}             icon="⊞" />
        <StatCard label="Có sẵn"            value={stats?.available_assets ?? 0}         color="var(--green)"  icon="✓" />
        <StatCard label="Đang sử dụng"      value={stats?.assigned_assets ?? 0}          color="var(--blue)"   icon="◉" />
        <StatCard label="Bảo trì"           value={stats?.maintenance_assets ?? 0}       color="var(--amber)"  icon="⚙" />
        <StatCard label="Nhân viên"         value={stats?.total_employees ?? 0}          icon="人" />
        <StatCard label="Bảo hành sắp hết"  value={stats?.warranty_expiring_soon ?? 0}  color="var(--amber)"  icon="⚠" />
        <StatCard label="Hết bảo hành"      value={(stats as any)?.warranty_expired ?? 0} color="var(--red)"  icon="✕" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Warranty sắp hết */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--amber)' }}>⚠</span> Bảo hành sắp hết (30 ngày)
          </h3>
          {!warrantyExpiring?.length ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Không có tài sản nào</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {warrantyExpiring.slice(0, 5).map(a => (
                <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 'var(--radius)', background: 'var(--amber-dim)', cursor: 'pointer',
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
              {(warrantyExpiring?.length ?? 0) > 5 && (
                <div onClick={() => navigate('/assets')} style={{ fontSize: 12, color: 'var(--blue)', cursor: 'pointer', textAlign: 'center', paddingTop: 4 }}>
                  Xem tất cả {warrantyExpiring?.length} tài sản →
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Warranty đã hết */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--red)' }}>✕</span> Đã hết bảo hành
          </h3>
          {!warrantyExpired?.length ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Không có tài sản nào</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {warrantyExpired.slice(0, 5).map(a => (
                <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 'var(--radius)', background: 'var(--red-dim)', cursor: 'pointer',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{a.asset_code}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--red)' }}>
                    {a.warranty_expiry ? format(new Date(a.warranty_expiry), 'dd/MM/yyyy') : '-'}
                  </div>
                </div>
              ))}
              {(warrantyExpired?.length ?? 0) > 5 && (
                <div onClick={() => navigate('/assets')} style={{ fontSize: 12, color: 'var(--blue)', cursor: 'pointer', textAlign: 'center', paddingTop: 4 }}>
                  Xem tất cả {warrantyExpired?.length} tài sản →
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Recent assets — giới hạn 5, có nút xem tất cả */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Tài sản mới nhập</h3>
          <span onClick={() => navigate('/assets')} style={{ fontSize: 12, color: 'var(--blue)', cursor: 'pointer' }}>
            Xem tất cả →
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentAssets?.items.slice(0, 5).map(a => (
            <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', borderRadius: 'var(--radius)', background: 'var(--bg-3)', cursor: 'pointer',
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
  )
}

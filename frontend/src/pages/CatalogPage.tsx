import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { AssetType, Location, Department } from '../types'
import {
  PageHeader, Button, Card, Table, Tr, Td,
  Modal, Input, Select, Spinner
} from '../components/ui'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'

type Tab = 'asset-types' | 'locations' | 'departments'

export default function CatalogPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('asset-types')
  const [showAdd, setShowAdd] = useState(false)

  // Asset type form
  const [atForm, setAtForm] = useState({ name: '', code: '', category: 'hardware', description: '' })
  // Location form
  const [locForm, setLocForm] = useState({ name: '', building: '', floor: '', room: '', description: '' })
  // Department form
  const [deptForm, setDeptForm] = useState({ name: '', code: '' })

  const { data: assetTypes, isLoading: loadingAt } = useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: () => api.get('/catalog/asset-types').then(r => r.data),
  })

  const { data: locations, isLoading: loadingLoc } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => api.get('/catalog/locations').then(r => r.data),
  })

  const { data: departments, isLoading: loadingDept } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/catalog/departments').then(r => r.data),
  })

  const addAtMutation = useMutation({
    mutationFn: () => api.post('/catalog/asset-types', atForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-types'] })
      toast.success('Đã thêm loại tài sản')
      setShowAdd(false)
      setAtForm({ name: '', code: '', category: 'hardware', description: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),

  })

  // Seed default asset types
  const DEFAULT_ASSET_TYPES = [
    { name: 'Laptop', code: 'LAPTOP', category: 'hardware', description: 'Máy tính xách tay' },
    { name: 'Desktop / PC', code: 'DESKTOP', category: 'hardware', description: 'Máy tính để bàn' },
    { name: 'Màn hình', code: 'MONITOR', category: 'peripheral', description: 'Monitor' },
    { name: 'Điện thoại', code: 'PHONE', category: 'hardware', description: 'Điện thoại công ty' },
    { name: 'Thiết bị mạng', code: 'NETWORK', category: 'hardware', description: 'Switch, Router, AP' },
    { name: 'Phụ kiện', code: 'ACCESSORY', category: 'peripheral', description: 'Chuột, bàn phím, tai nghe...' },
  ]

  const seedMutation = useMutation({
    mutationFn: async () => {
      for (const item of DEFAULT_ASSET_TYPES) {
        try { await api.post('/catalog/asset-types', item) } catch { /* skip duplicate */ }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-types'] })
      toast.success('Đã tạo danh mục mặc định')
    },
  })

  const addLocMutation = useMutation({
    mutationFn: () => api.post('/catalog/locations', locForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Đã thêm vị trí')
      setShowAdd(false)
      setLocForm({ name: '', building: '', floor: '', room: '', description: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const addDeptMutation = useMutation({
    mutationFn: () => api.post('/catalog/departments', deptForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Đã thêm phòng ban')
      setShowAdd(false)
      setDeptForm({ name: '', code: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const deleteLocMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/locations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Đã xoá')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Không thể xoá'),
  })

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'asset-types', label: 'Loại tài sản', icon: '⊞' },
    { key: 'locations',   label: 'Vị trí',       icon: '◎' },
    { key: 'departments', label: 'Phòng ban',     icon: '▤' },
  ]

  const isLoading = loadingAt || loadingLoc || loadingDept

  return (
    <div>
      <PageHeader
        title="Danh mục"
        subtitle="Quản lý loại tài sản, vị trí và phòng ban"
        action={user?.is_admin && (
          <Button onClick={() => setShowAdd(true)}>+ Thêm</Button>
        )}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius)',
            background: tab === t.key ? 'var(--bg-4)' : 'transparent',
            color: tab === t.key ? 'var(--text-1)' : 'var(--text-2)',
            border: '1px solid', borderColor: tab === t.key ? 'var(--border-2)' : 'transparent',
            cursor: 'pointer', fontSize: 13.5, fontWeight: tab === t.key ? 500 : 400,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        {isLoading ? <Spinner /> : (
          <>
            {/* Asset Types */}
            {tab === 'asset-types' && (
              <>
                {!assetTypes?.length && user?.is_admin && (
                  <div style={{
                    padding: '24px 20px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
                    background: 'var(--amber-dim)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--amber)' }}>Chưa có loại tài sản nào</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                        Tạo nhanh 6 loại mặc định: Laptop, Desktop, Màn hình, Điện thoại, Thiết bị mạng, Phụ kiện
                      </div>
                    </div>
                    <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}
                      style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {seedMutation.isPending ? 'Đang tạo...' : '⚡ Tạo danh mục mặc định'}
                    </Button>
                  </div>
                )}
                <Table headers={['Tên', 'Mã', 'Danh mục', 'Mô tả']} empty={!assetTypes?.length}>
                  {assetTypes?.map(t => (
                    <Tr key={t.id}>
                      <Td><span style={{ fontWeight: 500 }}>{t.name}</span></Td>
                      <Td mono>{t.code ?? '—'}</Td>
                      <Td>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 99,
                          background: 'var(--bg-4)', color: 'var(--text-2)',
                        }}>{t.category}</span>
                      </Td>
                      <Td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{t.description ?? '—'}</span></Td>
                    </Tr>
                  ))}
                </Table>
              </>
            )}

            {/* Locations */}
            {tab === 'locations' && (
              <Table headers={['Tên', 'Toà nhà', 'Tầng', 'Phòng', '']} empty={!locations?.length}>
                {locations?.map(l => (
                  <Tr key={l.id}>
                    <Td><span style={{ fontWeight: 500 }}>{l.name}</span></Td>
                    <Td>{l.building ?? '—'}</Td>
                    <Td>{l.floor ?? '—'}</Td>
                    <Td>{l.room ?? '—'}</Td>
                    <Td>
                      {user?.is_admin && (
                        <button onClick={() => {
                          if (confirm('Xoá vị trí này?')) deleteLocMutation.mutate(l.id)
                        }} style={{
                          background: 'none', border: 'none',
                          color: 'var(--text-3)', cursor: 'pointer', fontSize: 14,
                        }}>🗑</button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}

            {/* Departments */}
            {tab === 'departments' && (
              <Table headers={['Tên phòng ban', 'Mã', 'Đơn vị']} empty={!departments?.length}>
                {departments?.map(d => (
                  <Tr key={d.id}>
                    <Td><span style={{ fontWeight: 500 }}>{d.name}</span></Td>
                    <Td mono>{d.code ?? '—'}</Td>
                    <Td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{d.business_unit_id ?? '—'}</span></Td>
                  </Tr>
                ))}
              </Table>
            )}
          </>
        )}
      </Card>

      {/* Add Modal */}
      {showAdd && tab === 'asset-types' && (
        <Modal title="Thêm loại tài sản" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addAtMutation.mutate() }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên loại" value={atForm.name} onChange={v => setAtForm(p => ({ ...p, name: v }))} required placeholder="Laptop" />
              <Input label="Mã" value={atForm.code} onChange={v => setAtForm(p => ({ ...p, code: v }))} placeholder="LAPTOP" />
              <Select label="Danh mục" value={atForm.category} onChange={v => setAtForm(p => ({ ...p, category: v }))}
                options={[
                  { value: 'hardware', label: 'Phần cứng' },
                  { value: 'peripheral', label: 'Thiết bị ngoại vi' },
                  { value: 'other', label: 'Khác' },
                ]} />
              <Input label="Mô tả" value={atForm.description} onChange={v => setAtForm(p => ({ ...p, description: v }))} placeholder="..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Button>
              <Button type="submit" disabled={addAtMutation.isPending}>Thêm</Button>
            </div>
          </form>
        </Modal>
      )}

      {showAdd && tab === 'locations' && (
        <Modal title="Thêm vị trí" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addLocMutation.mutate() }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Tên vị trí" value={locForm.name} onChange={v => setLocForm(p => ({ ...p, name: v }))} required placeholder="Tầng 3 - Phòng IT" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Toà nhà" value={locForm.building} onChange={v => setLocForm(p => ({ ...p, building: v }))} placeholder="Tòa A" />
              <Input label="Tầng" value={locForm.floor} onChange={v => setLocForm(p => ({ ...p, floor: v }))} placeholder="3" />
              <Input label="Phòng" value={locForm.room} onChange={v => setLocForm(p => ({ ...p, room: v }))} placeholder="301" />
              <Input label="Mô tả" value={locForm.description} onChange={v => setLocForm(p => ({ ...p, description: v }))} placeholder="..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Button>
              <Button type="submit" disabled={addLocMutation.isPending}>Thêm</Button>
            </div>
          </form>
        </Modal>
      )}

      {showAdd && tab === 'departments' && (
        <Modal title="Thêm phòng ban" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addDeptMutation.mutate() }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Tên phòng ban" value={deptForm.name} onChange={v => setDeptForm(p => ({ ...p, name: v }))} required placeholder="Phòng IT" />
            <Input label="Mã" value={deptForm.code} onChange={v => setDeptForm(p => ({ ...p, code: v }))} placeholder="IT" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Button>
              <Button type="submit" disabled={addDeptMutation.isPending}>Thêm</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

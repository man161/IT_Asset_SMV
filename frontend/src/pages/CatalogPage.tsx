import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { AssetType, Location, Department, BusinessUnit } from '../types'
import { PageHeader, Button, Card, Table, Tr, Td, Modal, Input, Select, Spinner } from '../components/ui'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'

type Tab = 'asset-types' | 'locations' | 'departments' | 'business-units'

export default function CatalogPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('asset-types')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)

  const [atForm, setAtForm] = useState({ name: '', code: '', category: 'hardware', description: '' })
  const [locForm, setLocForm] = useState({ name: '', building: '', floor: '', room: '', description: '' })
  const [deptForm, setDeptForm] = useState({ name: '', code: '', business_unit_id: '' })
  const [buForm, setBuForm] = useState({ name: '', code: '', description: '' })

  const { data: assetTypes } = useQuery<AssetType[]>({ queryKey: ['asset-types'], queryFn: () => api.get('/catalog/asset-types').then(r => r.data) })
  const { data: locations } = useQuery<Location[]>({ queryKey: ['locations'], queryFn: () => api.get('/catalog/locations').then(r => r.data) })
  const { data: departments } = useQuery<Department[]>({ queryKey: ['departments'], queryFn: () => api.get('/catalog/departments').then(r => r.data) })
  const { data: businessUnits } = useQuery<BusinessUnit[]>({ queryKey: ['business-units'], queryFn: () => api.get('/catalog/business-units').then(r => r.data) })

  // ── Add mutations ──
  const addAtMutation = useMutation({
    mutationFn: () => api.post('/catalog/asset-types', atForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['asset-types'] }); toast.success('Đã thêm'); setShowAdd(false); setAtForm({ name: '', code: '', category: 'hardware', description: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const DEFAULT_ASSET_TYPES = [
    { name: 'Laptop', code: 'LAPTOP', category: 'hardware', description: 'Máy tính xách tay' },
    { name: 'Desktop / PC', code: 'DESKTOP', category: 'hardware', description: 'Máy tính để bàn' },
    { name: 'Màn hình', code: 'MONITOR', category: 'peripheral', description: 'Monitor' },
    { name: 'Điện thoại', code: 'PHONE', category: 'hardware', description: 'Điện thoại công ty' },
    { name: 'Thiết bị mạng', code: 'NETWORK', category: 'hardware', description: 'Switch, Router, AP' },
    { name: 'Phụ kiện', code: 'ACCESSORY', category: 'peripheral', description: 'Chuột, bàn phím...' },
  ]
  const seedMutation = useMutation({
    mutationFn: async () => { for (const item of DEFAULT_ASSET_TYPES) { try { await api.post('/catalog/asset-types', item) } catch {} } },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['asset-types'] }); toast.success('Đã tạo danh mục mặc định') },
  })

  const addLocMutation = useMutation({
    mutationFn: () => api.post('/catalog/locations', locForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); toast.success('Đã thêm'); setShowAdd(false); setLocForm({ name: '', building: '', floor: '', room: '', description: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })
  const addDeptMutation = useMutation({
    mutationFn: () => api.post('/catalog/departments', deptForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Đã thêm'); setShowAdd(false); setDeptForm({ name: '', code: '', business_unit_id: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })
  const addBuMutation = useMutation({
    mutationFn: () => api.post('/catalog/business-units', buForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['business-units'] }); toast.success('Đã thêm'); setShowAdd(false); setBuForm({ name: '', code: '', description: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  // ── Edit mutations ──
  const editAtMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/catalog/asset-types/${editItem.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['asset-types'] }); toast.success('Đã cập nhật'); setEditItem(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })
  const editLocMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/catalog/locations/${editItem.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); toast.success('Đã cập nhật'); setEditItem(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })
  const editDeptMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/catalog/departments/${editItem.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Đã cập nhật'); setEditItem(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })
  const editBuMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/catalog/business-units/${editItem.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['business-units'] }); toast.success('Đã cập nhật'); setEditItem(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  // ── Delete mutations ──
  const delAtMutation = useMutation({ mutationFn: (id: string) => api.delete(`/catalog/asset-types/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['asset-types'] }); toast.success('Đã xoá') } })
  const delLocMutation = useMutation({ mutationFn: (id: string) => api.delete(`/catalog/locations/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); toast.success('Đã xoá') } })
  const delDeptMutation = useMutation({ mutationFn: (id: string) => api.delete(`/catalog/departments/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Đã xoá') } })
  const delBuMutation = useMutation({ mutationFn: (id: string) => api.delete(`/catalog/business-units/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['business-units'] }); toast.success('Đã xoá') } })

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'asset-types',    label: 'Loại tài sản', icon: '⊞' },
    { key: 'locations',      label: 'Vị trí',        icon: '◎' },
    { key: 'departments',    label: 'Phòng ban',      icon: '▤' },
    { key: 'business-units', label: 'Business Unit',  icon: '🏢' },
  ]

  const ActionBtns = ({ item, onEdit }: { item: any; onEdit: () => void }) => (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={onEdit} style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12 }}>✏</button>
      <button onClick={() => {
        if (!confirm('Xoá mục này?')) return
        if (tab === 'asset-types') delAtMutation.mutate(item.id)
        else if (tab === 'locations') delLocMutation.mutate(item.id)
        else if (tab === 'departments') delDeptMutation.mutate(item.id)
        else delBuMutation.mutate(item.id)
      }} style={{ background: 'var(--red-dim)', border: '1px solid var(--red-dim)', borderRadius: 6, padding: '3px 10px', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}>🗑</button>
    </div>
  )

  return (
    <div>
      <PageHeader title="Danh mục" subtitle="Quản lý loại tài sản, vị trí, phòng ban, BU"
        action={user?.is_admin && <Button onClick={() => setShowAdd(true)}>+ Thêm</Button>} />

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius)',
            background: tab === t.key ? 'var(--bg-4)' : 'transparent',
            color: tab === t.key ? 'var(--text-1)' : 'var(--text-2)',
            border: '1px solid', borderColor: tab === t.key ? 'var(--border-2)' : 'transparent',
            cursor: 'pointer', fontSize: 13.5, fontWeight: tab === t.key ? 500 : 400,
            display: 'flex', alignItems: 'center', gap: 7,
          }}><span>{t.icon}</span>{t.label}</button>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        {/* Asset Types */}
        {tab === 'asset-types' && (
          <>
            {!assetTypes?.length && user?.is_admin && (
              <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--amber-dim)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--amber)' }}>Chưa có loại tài sản</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Tạo nhanh 6 loại mặc định</div>
                </div>
                <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>⚡ Tạo mặc định</Button>
              </div>
            )}
            <Table headers={['Tên', 'Mã', 'Danh mục', 'Mô tả', '']} empty={!assetTypes?.length}>
              {assetTypes?.map(t => (
                <Tr key={t.id}>
                  <Td><span style={{ fontWeight: 500 }}>{t.name}</span></Td>
                  <Td mono>{t.code ?? '—'}</Td>
                  <Td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-4)', color: 'var(--text-2)' }}>{t.category}</span></Td>
                  <Td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{t.description ?? '—'}</span></Td>
                  <Td>{user?.is_admin && <ActionBtns item={t} onEdit={() => setEditItem({ ...t, _tab: 'asset-types' })} />}</Td>
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
                <Td>{user?.is_admin && <ActionBtns item={l} onEdit={() => setEditItem({ ...l, _tab: 'locations' })} />}</Td>
              </Tr>
            ))}
          </Table>
        )}

        {/* Departments */}
        {tab === 'departments' && (
          <Table headers={['Tên phòng ban', 'Mã', 'Business Unit', '']} empty={!departments?.length}>
            {departments?.map(d => (
              <Tr key={d.id}>
                <Td><span style={{ fontWeight: 500 }}>{d.name}</span></Td>
                <Td mono>{d.code ?? '—'}</Td>
                <Td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{businessUnits?.find(b => b.id === d.business_unit_id)?.name ?? '—'}</span></Td>
                <Td>{user?.is_admin && <ActionBtns item={d} onEdit={() => setEditItem({ ...d, _tab: 'departments' })} />}</Td>
              </Tr>
            ))}
          </Table>
        )}

        {/* Business Units */}
        {tab === 'business-units' && (
          <Table headers={['Tên', 'Mã', 'Mô tả', '']} empty={!businessUnits?.length}>
            {businessUnits?.map(b => (
              <Tr key={b.id}>
                <Td><span style={{ fontWeight: 500 }}>{b.name}</span></Td>
                <Td mono>{b.code ?? '—'}</Td>
                <Td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{b.description ?? '—'}</span></Td>
                <Td>{user?.is_admin && <ActionBtns item={b} onEdit={() => setEditItem({ ...b, _tab: 'business-units' })} />}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* ── Add Modal ── */}
      {showAdd && tab === 'asset-types' && (
        <Modal title="Thêm loại tài sản" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addAtMutation.mutate() }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên loại" value={atForm.name} onChange={v => setAtForm(p => ({ ...p, name: v }))} required placeholder="Laptop" />
              <Input label="Mã" value={atForm.code} onChange={v => setAtForm(p => ({ ...p, code: v }))} placeholder="LAPTOP" />
              <Select label="Danh mục" value={atForm.category} onChange={v => setAtForm(p => ({ ...p, category: v }))} options={[{ value: 'hardware', label: 'Phần cứng' }, { value: 'peripheral', label: 'Ngoại vi' }, { value: 'other', label: 'Khác' }]} />
              <Input label="Mô tả" value={atForm.description} onChange={v => setAtForm(p => ({ ...p, description: v }))} />
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
          <form onSubmit={e => { e.preventDefault(); addLocMutation.mutate() }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Tên vị trí" value={locForm.name} onChange={v => setLocForm(p => ({ ...p, name: v }))} required placeholder="Tầng 3 - Phòng IT" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Toà nhà" value={locForm.building} onChange={v => setLocForm(p => ({ ...p, building: v }))} />
              <Input label="Tầng" value={locForm.floor} onChange={v => setLocForm(p => ({ ...p, floor: v }))} />
              <Input label="Phòng" value={locForm.room} onChange={v => setLocForm(p => ({ ...p, room: v }))} />
              <Input label="Mô tả" value={locForm.description} onChange={v => setLocForm(p => ({ ...p, description: v }))} />
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
          <form onSubmit={e => { e.preventDefault(); addDeptMutation.mutate() }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên phòng ban" value={deptForm.name} onChange={v => setDeptForm(p => ({ ...p, name: v }))} required />
              <Input label="Mã" value={deptForm.code} onChange={v => setDeptForm(p => ({ ...p, code: v }))} />
              <Select label="Business Unit" value={deptForm.business_unit_id} onChange={v => setDeptForm(p => ({ ...p, business_unit_id: v }))}
                options={(businessUnits ?? []).map(b => ({ value: b.id, label: b.name }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Button>
              <Button type="submit" disabled={addDeptMutation.isPending}>Thêm</Button>
            </div>
          </form>
        </Modal>
      )}

      {showAdd && tab === 'business-units' && (
        <Modal title="Thêm Business Unit" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addBuMutation.mutate() }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên BU" value={buForm.name} onChange={v => setBuForm(p => ({ ...p, name: v }))} required />
              <Input label="Mã" value={buForm.code} onChange={v => setBuForm(p => ({ ...p, code: v }))} />
              <Input label="Mô tả" value={buForm.description} onChange={v => setBuForm(p => ({ ...p, description: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Button>
              <Button type="submit" disabled={addBuMutation.isPending}>Thêm</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editItem && editItem._tab === 'asset-types' && (
        <Modal title="Chỉnh sửa loại tài sản" onClose={() => setEditItem(null)}>
          <form onSubmit={e => { e.preventDefault(); editAtMutation.mutate({ name: editItem.name, code: editItem.code, category: editItem.category, description: editItem.description }) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên loại" value={editItem.name} onChange={v => setEditItem((p: any) => ({ ...p, name: v }))} required />
              <Input label="Mã" value={editItem.code ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, code: v }))} />
              <Select label="Danh mục" value={editItem.category} onChange={v => setEditItem((p: any) => ({ ...p, category: v }))} options={[{ value: 'hardware', label: 'Phần cứng' }, { value: 'peripheral', label: 'Ngoại vi' }, { value: 'other', label: 'Khác' }]} />
              <Input label="Mô tả" value={editItem.description ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, description: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setEditItem(null)}>Hủy</Button>
              <Button type="submit" disabled={editAtMutation.isPending}>Lưu</Button>
            </div>
          </form>
        </Modal>
      )}

      {editItem && editItem._tab === 'locations' && (
        <Modal title="Chỉnh sửa vị trí" onClose={() => setEditItem(null)}>
          <form onSubmit={e => { e.preventDefault(); editLocMutation.mutate({ name: editItem.name, building: editItem.building, floor: editItem.floor, room: editItem.room, description: editItem.description }) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Tên vị trí" value={editItem.name} onChange={v => setEditItem((p: any) => ({ ...p, name: v }))} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Toà nhà" value={editItem.building ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, building: v }))} />
              <Input label="Tầng" value={editItem.floor ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, floor: v }))} />
              <Input label="Phòng" value={editItem.room ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, room: v }))} />
              <Input label="Mô tả" value={editItem.description ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, description: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setEditItem(null)}>Hủy</Button>
              <Button type="submit" disabled={editLocMutation.isPending}>Lưu</Button>
            </div>
          </form>
        </Modal>
      )}

      {editItem && editItem._tab === 'departments' && (
        <Modal title="Chỉnh sửa phòng ban" onClose={() => setEditItem(null)}>
          <form onSubmit={e => { e.preventDefault(); editDeptMutation.mutate({ name: editItem.name, code: editItem.code, business_unit_id: editItem.business_unit_id }) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên phòng ban" value={editItem.name} onChange={v => setEditItem((p: any) => ({ ...p, name: v }))} required />
              <Input label="Mã" value={editItem.code ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, code: v }))} />
              <Select label="Business Unit" value={editItem.business_unit_id ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, business_unit_id: v }))}
                options={(businessUnits ?? []).map(b => ({ value: b.id, label: b.name }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setEditItem(null)}>Hủy</Button>
              <Button type="submit" disabled={editDeptMutation.isPending}>Lưu</Button>
            </div>
          </form>
        </Modal>
      )}

      {editItem && editItem._tab === 'business-units' && (
        <Modal title="Chỉnh sửa Business Unit" onClose={() => setEditItem(null)}>
          <form onSubmit={e => { e.preventDefault(); editBuMutation.mutate({ name: editItem.name, code: editItem.code, description: editItem.description }) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên BU" value={editItem.name} onChange={v => setEditItem((p: any) => ({ ...p, name: v }))} required />
              <Input label="Mã" value={editItem.code ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, code: v }))} />
              <Input label="Mô tả" value={editItem.description ?? ''} onChange={v => setEditItem((p: any) => ({ ...p, description: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setEditItem(null)}>Hủy</Button>
              <Button type="submit" disabled={editBuMutation.isPending}>Lưu</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

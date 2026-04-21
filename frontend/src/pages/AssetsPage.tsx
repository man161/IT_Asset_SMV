import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Asset, AssetType, Location, PaginatedResponse } from '../types'
import {
  PageHeader, SearchInput, Button, Card, Table, Tr, Td, Badge,
  Modal, Input, Select, Pagination, Spinner
} from '../components/ui'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useAuthStore } from '../store/auth'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Có sẵn' },
  { value: 'assigned',  label: 'Đang dùng' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'disposed',  label: 'Thanh lý' },
]

const EMPTY_FORM = {
  asset_code: '', name: '', asset_type_id: '',
  brand: '', model: '', serial_number: '', vendor: '',
  status: 'available',
  os: '', os_version: '', windows_version: '', office_version: '',
  mac_address: '', wifi_mac: '',
  purchase_date: '', warranty_expiry: '',
  location_ids: [] as string[],
  note: '',
}

export default function AssetsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery<PaginatedResponse<Asset>>({
    queryKey: ['assets', page, search, filterStatus, filterType],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), size: '20' })
      if (search) p.set('search', search)
      if (filterStatus) p.set('status', filterStatus)
      if (filterType) p.set('asset_type_id', filterType)
      return api.get(`/assets?${p}`).then(r => r.data)
    },
  })

  const { data: types } = useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: () => api.get('/catalog/asset-types').then(r => r.data),
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => api.get('/catalog/locations').then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (d: typeof form) => {
      const locationNames = d.location_ids
        .map(id => locations?.find(l => l.id === id)?.name)
        .filter(Boolean).join(', ')
      return api.post('/assets', {
        ...d,
        purchase_date: d.purchase_date || null,
        warranty_expiry: d.warranty_expiry || null,
        location_id: d.location_ids[0] || null,
        asset_type_id: d.asset_type_id || null,
        note: [
          d.note,
          d.vendor ? `Vendor: ${d.vendor}` : '',
          d.location_ids.length > 1 ? `Vị trí: ${locationNames}` : '',
        ].filter(Boolean).join(' | ') || null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Đã thêm tài sản')
      setShowAdd(false)
      setForm(EMPTY_FORM)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi thêm tài sản'),
  })

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Tài sản"
        subtitle={`${data?.total ?? 0} tài sản`}
        action={user?.is_admin && <Button onClick={() => setShowAdd(true)}>+ Thêm tài sản</Button>}
      />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Tìm theo tên, mã, serial..." />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-1)', fontSize: 13,
          }}>
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-1)', fontSize: 13,
          }}>
            <option value="">Tất cả loại</option>
            {types?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        {isLoading ? <Spinner /> : (
          <Table
            headers={['Mã', 'Tên tài sản', 'Loại', 'OS / Office', 'Trạng thái', 'Người dùng', 'Bảo hành', '']}
            empty={!data?.items.length}
          >
            {data?.items.map(a => (
              <Tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)}>
                <Td mono>{a.asset_code}</Td>
                <Td>
                  <div style={{ fontWeight: 500 }}>{a.name}</div>
                  {a.model && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.brand} {a.model}</div>}
                </Td>
                <Td>{a.asset_type?.name ?? '—'}</Td>
                <Td>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{(a as any).os ?? '—'}</div>
                  {(a as any).office_version && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{(a as any).office_version}</div>}
                </Td>
                <Td><Badge status={a.status} /></Td>
                <Td>
                  {(a as any).current_assignee
                    ? <span style={{ color: 'var(--blue)', fontSize: 13 }}>{(a as any).current_assignee.full_name}</span>
                    : <span style={{ color: 'var(--text-3)' }}>—</span>}
                </Td>
                <Td>
                  {a.warranty_expiry
                    ? <span style={{ color: new Date(a.warranty_expiry) < new Date() ? 'var(--red)' : 'var(--text-2)', fontSize: 12 }}>
                        {format(new Date(a.warranty_expiry), 'dd/MM/yyyy')}
                      </span>
                    : '—'}
                </Td>
                <Td><span style={{ color: 'var(--text-3)' }}>›</span></Td>
              </Tr>
            ))}
          </Table>
        )}
        <div style={{ padding: '12px 16px' }}>
          <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
        </div>
      </Card>

      {showAdd && (
        <Modal title="Thêm tài sản" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>

            {/* Thông tin cơ bản */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Thông tin cơ bản</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Mã tài sản" value={form.asset_code} onChange={f('asset_code')} required placeholder="SMV-L00034" />
                <Input label="Tên tài sản" value={form.name} onChange={f('name')} required placeholder="Laptop Dell Latitude 3400" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Loại tài sản</span>
                  <select value={form.asset_type_id} onChange={e => f('asset_type_id')(e.target.value)} style={{
                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 11px',
                    color: form.asset_type_id ? 'var(--text-1)' : 'var(--text-3)', fontSize: 13.5, outline: 'none',
                  }}>
                    <option value="">— Chọn —</option>
                    {(types ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {(types ?? []).length === 0 && (
                    <span style={{ fontSize: 11, color: 'var(--amber)' }}>
                      Vào <b>Danh mục → Loại tài sản</b> để tạo trước
                    </span>
                  )}
                </div>

                <Input label="Thương hiệu" value={form.brand} onChange={f('brand')} placeholder="Dell" />
                <Input label="Model" value={form.model} onChange={f('model')} placeholder="Latitude 3400" />
                <Input label="Serial number" value={form.serial_number} onChange={f('serial_number')} placeholder="GLX1GW2" />
                <Input label="Vendor" value={form.vendor} onChange={f('vendor')} placeholder="FPT, Synnex, DigiWorld..." />

                {/* Vị trí multi-select — full width */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Vị trí</span>
                  <select
                    multiple
                    value={form.location_ids}
                    onChange={e => setForm(p => ({ ...p, location_ids: [...e.target.selectedOptions].map(o => o.value) }))}
                    style={{
                      background: 'var(--bg-3)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '6px',
                      color: 'var(--text-1)', fontSize: 13.5, outline: 'none', height: 88,
                    }}
                  >
                    {(locations ?? []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    Giữ <b>Ctrl</b> (Windows) / <b>Cmd</b> (Mac) để chọn nhiều vị trí
                  </span>
                </div>
              </div>
            </div>

            {/* Hệ điều hành & Phần mềm */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Hệ điều hành & Phần mềm</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Hệ điều hành" value={form.os} onChange={f('os')}
                  placeholder="Windows, macOS 14, Ubuntu..." />
                <Input label="OS" value={form.os_version} onChange={f('os_version')}
                  placeholder="22H2, Ventura 13.5, 22.04 LTS..." />

                {/* datalist: chọn từ gợi ý hoặc gõ tay phiên bản mới */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Phiên bản Windows</span>
                  <input
                    list="win-versions"
                    value={form.windows_version}
                    onChange={e => f('windows_version')(e.target.value)}
                    placeholder="Chọn hoặc gõ tay..."
                    style={{
                      background: 'var(--bg-3)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 11px',
                      color: 'var(--text-1)', fontSize: 13.5, outline: 'none', width: '100%',
                    }}
                  />
                  <datalist id="win-versions">
                    <option value="10 Home" />
                    <option value="10 Pro" />
                    <option value="11 Home" />
                    <option value="11 Pro" />
                    <option value="11 Enterprise" />
                  </datalist>
                </div>

                <Input label="Office (ghi tự do)" value={form.office_version} onChange={f('office_version')}
                  placeholder="Office 2021, 365, None..." />
              </div>
            </div>

            {/* Mạng */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Địa chỉ mạng</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="MAC Address (LAN)" value={form.mac_address} onChange={f('mac_address')} placeholder="AA:BB:CC:DD:EE:FF" />
                <Input label="WiFi MAC" value={form.wifi_mac} onChange={f('wifi_mac')} placeholder="AA:BB:CC:DD:EE:FF" />
              </div>
            </div>

            {/* Bảo hành */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Bảo hành</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Ngày mua" value={form.purchase_date} onChange={f('purchase_date')} type="date" />
                <Input label="Hết bảo hành" value={form.warranty_expiry} onChange={f('warranty_expiry')} type="date" />
              </div>
            </div>

            <Input label="Ghi chú" value={form.note} onChange={f('note')} placeholder="..." />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Đang lưu...' : 'Thêm tài sản'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

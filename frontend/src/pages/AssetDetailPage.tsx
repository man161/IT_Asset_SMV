import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Asset, AssetAssignment, Employee, Department, Location, AssetType } from '../types'
import { Badge, Button, Card, Modal, Input, Select, Spinner } from '../components/ui'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useAuthStore } from '../store/auth'

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const [showAssign, setShowAssign] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showEditAsset, setShowEditAsset] = useState(false)
  const [showAddLogin, setShowAddLogin] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [searchEmployee, setSearchEmployee] = useState('')
  const [maintenanceForm, setMaintenanceForm] = useState({ note: '', expected_return: '' })

  const [assignForm, setAssignForm] = useState({ employee_id: '', assigned_date: '', reason: '' })
  const [returnForm, setReturnForm] = useState({ returned_date: '', return_reason: '' })
  const [loginForm, setLoginForm] = useState({ username: '', domain: '', note: '' })

  const { data: asset, isLoading } = useQuery<Asset>({
    queryKey: ['asset', id],
    queryFn: () => api.get(`/assets/${id}`).then(r => r.data),
  })

  const { data: assignments } = useQuery<AssetAssignment[]>({
    queryKey: ['asset-assignments', id],
    queryFn: () => api.get(`/assignments?asset_id=${id}&size=50`).then(r => r.data.items),
  })

  const { data: employees, isLoading: loadingEmployees } = useQuery<{ items: Employee[] }>({
    queryKey: ['employees-for-assign', id],
    queryFn: () => api.get('/employees?size=500&page=1').then(r => r.data),
    staleTime: 0,
    gcTime: 0,
  })

  const { data: types } = useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: () => api.get('/catalog/asset-types').then(r => r.data),
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => api.get('/catalog/locations').then(r => r.data),
  })

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/catalog/departments').then(r => r.data),
  })

  const { data: logins, refetch: refetchLogins } = useQuery<any[]>({
    queryKey: ['asset-logins', id],
    queryFn: () => api.get(`/assets/${id}/logins`).then(r => r.data).catch(() => []),
  })

  // Edit asset form — initialized from asset data when modal opens
  const [editForm, setEditForm] = useState<any>({})

  const openEditAsset = () => {
    if (!asset) return
    setEditForm({
      name: asset.name ?? '',
      asset_type_id: asset.asset_type_id ?? '',
      brand: asset.brand ?? '',
      model: asset.model ?? '',
      serial_number: asset.serial_number ?? '',
      status: asset.status ?? 'available',
      os: (asset as any).os ?? '',
      os_version: (asset as any).os_version ?? '',
      windows_version: (asset as any).windows_version ?? '',
      office_version: (asset as any).office_version ?? '',
      mac_address: (asset as any).mac_address ?? '',
      wifi_mac: (asset as any).wifi_mac ?? '',
      purchase_date: asset.purchase_date ?? '',
      warranty_expiry: asset.warranty_expiry ?? '',
      location_id: asset.location_id ?? '',
      note: asset.note ?? '',
    })
    setShowEditAsset(true)
  }

  const assignMutation = useMutation({
    mutationFn: (d: typeof assignForm) => api.post('/assignments', { asset_id: id, ...d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', id] })
      qc.invalidateQueries({ queryKey: ['asset-assignments', id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Đã bàn giao tài sản')
      setShowAssign(false)
      setAssignForm({ employee_id: '', assigned_date: '', reason: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const activeAssignment = assignments?.find(a => a.status === 'active')

  const returnMutation = useMutation({
    mutationFn: (d: typeof returnForm) => api.post(`/assignments/${activeAssignment?.id}/return`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', id] })
      qc.invalidateQueries({ queryKey: ['asset-assignments', id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Đã thu hồi tài sản')
      setShowReturn(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const editAssetMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/assets/${id}`, {
      ...d,
      purchase_date: d.purchase_date || null,
      warranty_expiry: d.warranty_expiry || null,
      location_id: d.location_id || null,
      asset_type_id: d.asset_type_id || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', id] })
      toast.success('Đã cập nhật tài sản')
      setShowEditAsset(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi cập nhật'),
  })

  const addLoginMutation = useMutation({
    mutationFn: (d: typeof loginForm) => api.post(`/assets/${id}/logins`, d),
    onSuccess: () => {
      refetchLogins()
      toast.success('Đã thêm tài khoản')
      setShowAddLogin(false)
      setLoginForm({ username: '', domain: '', note: '' })
    },
    onError: () => toast.error('Lỗi thêm tài khoản'),
  })

  const deleteLoginMutation = useMutation({
    mutationFn: (loginId: string) => api.delete(`/assets/${id}/logins/${loginId}`),
    onSuccess: () => { refetchLogins(); toast.success('Đã xoá') },
  })

  const maintenanceMutation = useMutation({
    mutationFn: (d: typeof maintenanceForm) => api.post(`/assets/${id}/send-maintenance`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Đã gửi bảo trì')
      setShowMaintenance(false)
      setMaintenanceForm({ note: '', expected_return: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const completeMaintMutation = useMutation({
    mutationFn: () => api.post(`/assets/${id}/complete-maintenance`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Hoàn thành bảo trì — tài sản đã về kho')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const ef = (k: string) => (v: string) => setEditForm((p: any) => ({ ...p, [k]: v }))

  if (isLoading) return <Spinner />
  if (!asset) return <div style={{ color: 'var(--text-2)' }}>Không tìm thấy tài sản</div>

  const specEntries = asset.specs ? Object.entries(asset.specs) : []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', marginBottom: 8, padding: 0 }}>← Quay lại</button>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>{asset.name}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)' }}>{asset.asset_code}</span>
            <Badge status={asset.status} />
          </div>
        </div>
        {user?.is_admin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={openEditAsset}>✏ Chỉnh sửa</Button>
            {asset.status === 'available' && (
              <>
                <Button onClick={() => setShowAssign(true)}>⇄ Bàn giao</Button>
                <Button variant="ghost" onClick={() => setShowMaintenance(true)}>⚙ Bảo trì</Button>
              </>
            )}
            {asset.status === 'assigned' && activeAssignment && (
              <Button variant="ghost" onClick={() => setShowReturn(true)}>↩ Thu hồi</Button>
            )}
            {asset.status === 'maintenance' && (
              <Button onClick={() => { if (confirm('Xác nhận hoàn thành bảo trì?')) completeMaintMutation.mutate() }}
                disabled={completeMaintMutation.isPending}>
                ✓ Hoàn thành bảo trì
              </Button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Thông tin tài sản</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['Loại tài sản', asset.asset_type?.name],
                ['Thương hiệu', asset.brand],
                ['Model', asset.model],
                ['Serial number', asset.serial_number],
                ['Vị trí', asset.location?.name],
                ['Ngày mua', asset.purchase_date ? format(new Date(asset.purchase_date), 'dd/MM/yyyy') : null],
                ['Hết bảo hành', asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'dd/MM/yyyy') : null],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: v ? 'var(--text-1)' : 'var(--text-3)' }}>{v ?? '—'}</div>
                </div>
              ))}
            </div>

            {((asset as any).os || (asset as any).windows_version || (asset as any).office_version || (asset as any).os_version) && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Hệ điều hành & Phần mềm</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  {[['Hệ điều hành', (asset as any).os], ['OS Version', (asset as any).os_version], ['Windows', (asset as any).windows_version], ['Office', (asset as any).office_version]].map(([k, v]) => (
                    <div key={k as string} style={{ padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: v ? 'var(--text-1)' : 'var(--text-3)' }}>{v ?? '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {((asset as any).mac_address || (asset as any).wifi_mac) && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Địa chỉ mạng</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['MAC (LAN)', (asset as any).mac_address], ['WiFi MAC', (asset as any).wifi_mac]].map(([k, v]) => (
                    <div key={k as string} style={{ padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: v ? 'var(--green)' : 'var(--text-3)' }}>{v ?? '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {asset.note && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>GHI CHÚ</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{asset.note}</div>
              </div>
            )}
          </Card>

          {/* Login accounts */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Tài khoản đăng nhập</h3>
              {user?.is_admin && <Button size="sm" onClick={() => setShowAddLogin(true)}>+ Thêm</Button>}
            </div>
            {!logins?.length ? (
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chưa có tài khoản nào</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logins.map((l: any) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg-3)', borderRadius: 'var(--radius)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                        {l.domain ? `${l.domain}\\` : ''}{l.username}
                      </div>
                      {l.note && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{l.note}</div>}
                    </div>
                    {user?.is_admin && (
                      <button onClick={() => { if (confirm('Xoá tài khoản này?')) deleteLoginMutation.mutate(l.id) }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Assignment history */}
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Lịch sử bàn giao</h3>
            {!assignments?.length ? (
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chưa có lịch sử bàn giao</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignments.map(a => (
                  <div key={a.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--bg-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.employee?.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                        {format(new Date(a.assigned_date), 'dd/MM/yyyy')}
                        {a.returned_date ? ` → ${format(new Date(a.returned_date), 'dd/MM/yyyy')}` : ' → Hiện tại'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{a.handover_code}</span>
                      <Badge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Người đang dùng</h3>
            {(asset as any).current_assignee ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--blue)' }}>
                  {(asset as any).current_assignee.full_name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--blue)' }}
                    onClick={() => navigate(`/employees/${(asset as any).current_assignee.id}`)}>
                    {(asset as any).current_assignee.full_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{(asset as any).current_assignee.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{(asset as any).current_assignee.department?.name}</div>
                </div>
                {activeAssignment && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Bàn giao: {format(new Date(activeAssignment.assigned_date), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Chưa giao cho ai</div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Assign Modal ── */}
      {showAssign && (
        <Modal title="Bàn giao tài sản" onClose={() => { setShowAssign(false); setSearchEmployee('') }}>
          <form onSubmit={e => { e.preventDefault(); assignMutation.mutate(assignForm) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                Nhân viên nhận <span style={{ color: 'var(--red)' }}>*</span>
              </span>
              <input
                value={searchEmployee}
                onChange={e => setSearchEmployee(e.target.value)}
                placeholder="Tìm nhanh tên nhân viên..."
                style={{
                  background: 'var(--bg-3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '7px 11px',
                  color: 'var(--text-1)', fontSize: 13.5, outline: 'none', width: '100%',
                }}
              />
              <select value={assignForm.employee_id}
                onChange={e => setAssignForm(p => ({ ...p, employee_id: e.target.value }))}
                required size={5}
                style={{
                  background: 'var(--bg-3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '4px',
                  color: 'var(--text-1)', fontSize: 13.5, outline: 'none', height: 130,
                }}>
                <option value="">{loadingEmployees ? 'Đang tải...' : '— Chọn nhân viên —'}</option>
                {(employees?.items ?? [])
                  .filter(e =>
                    searchEmployee === '' ||
                    e.full_name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                    e.employee_code.toLowerCase().includes(searchEmployee.toLowerCase())
                  )
                  .map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} — {e.employee_code}</option>
                  ))}
              </select>
              {!loadingEmployees && (employees?.items ?? []).length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--amber)' }}>Chưa có nhân viên — vào trang Nhân viên để thêm trước</span>
              )}
            </div>
            <Input label="Ngày bàn giao" value={assignForm.assigned_date}
              onChange={v => setAssignForm(p => ({ ...p, assigned_date: v }))} type="date" required />
            <Input label="Lý do / Ghi chú" value={assignForm.reason}
              onChange={v => setAssignForm(p => ({ ...p, reason: v }))} placeholder="Phục vụ công việc..." />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => { setShowAssign(false); setSearchEmployee('') }}>Hủy</Button>
              <Button type="submit" disabled={assignMutation.isPending}>Xác nhận bàn giao</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Return Modal ── */}
      {showReturn && (
        <Modal title="Thu hồi tài sản" onClose={() => setShowReturn(false)}>
          <form onSubmit={e => { e.preventDefault(); returnMutation.mutate(returnForm) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--bg-3)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              Ngày bàn giao: <b>{activeAssignment ? format(new Date(activeAssignment.assigned_date), 'dd/MM/yyyy') : '—'}</b>
            </div>
            <Input label="Ngày thu hồi" value={returnForm.returned_date}
              onChange={v => setReturnForm(p => ({ ...p, returned_date: v }))} type="date" required
              min={activeAssignment?.assigned_date ?? ''} />
            <Input label="Lý do thu hồi" value={returnForm.return_reason}
              onChange={v => setReturnForm(p => ({ ...p, return_reason: v }))} placeholder="Nhân viên nghỉ việc..." />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowReturn(false)}>Hủy</Button>
              <Button type="submit" variant="danger" disabled={returnMutation.isPending}>Xác nhận thu hồi</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Maintenance Modal ── */}
      {showMaintenance && (
        <Modal title="Gửi tài sản bảo trì" onClose={() => setShowMaintenance(false)}>
          <form onSubmit={e => { e.preventDefault(); maintenanceMutation.mutate(maintenanceForm) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Mô tả vấn đề / Lý do bảo trì" value={maintenanceForm.note}
              onChange={v => setMaintenanceForm(p => ({ ...p, note: v }))} placeholder="Màn hình bị hỏng, thay pin..." />
            <Input label="Ngày dự kiến trả về" value={maintenanceForm.expected_return}
              onChange={v => setMaintenanceForm(p => ({ ...p, expected_return: v }))} type="date" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowMaintenance(false)}>Hủy</Button>
              <Button type="submit" disabled={maintenanceMutation.isPending} style={{ background: 'var(--amber)', borderColor: 'var(--amber)' }}>
                {maintenanceMutation.isPending ? 'Đang gửi...' : '⚙ Xác nhận gửi bảo trì'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Asset Modal ── */}
      {showEditAsset && (
        <Modal title="Chỉnh sửa tài sản" onClose={() => setShowEditAsset(false)}>
          <form onSubmit={e => { e.preventDefault(); editAssetMutation.mutate(editForm) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Thông tin cơ bản</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên tài sản" value={editForm.name} onChange={ef('name')} required />
              <Select label="Loại tài sản" value={editForm.asset_type_id} onChange={ef('asset_type_id')}
                options={(types ?? []).map(t => ({ value: t.id, label: t.name }))} />
              <Input label="Thương hiệu" value={editForm.brand} onChange={ef('brand')} />
              <Input label="Model" value={editForm.model} onChange={ef('model')} />
              <Input label="Serial number" value={editForm.serial_number} onChange={ef('serial_number')} />
              <Select label="Trạng thái" value={editForm.status} onChange={ef('status')} options={[
                { value: 'available', label: 'Có sẵn' },
                { value: 'assigned', label: 'Đang dùng' },
                { value: 'maintenance', label: 'Bảo trì' },
                { value: 'disposed', label: 'Thanh lý' },
              ]} />
              <Select label="Vị trí" value={editForm.location_id} onChange={ef('location_id')}
                options={(locations ?? []).map(l => ({ value: l.id, label: l.name }))} />
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 }}>Hệ điều hành & Phần mềm</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Hệ điều hành" value={editForm.os} onChange={ef('os')} placeholder="Windows, macOS..." />
              <Input label="OS Version" value={editForm.os_version} onChange={ef('os_version')} placeholder="22H2, Ventura..." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Phiên bản Windows</span>
                <input list="win-ver-edit" value={editForm.windows_version} onChange={e => ef('windows_version')(e.target.value)}
                  placeholder="Chọn hoặc gõ tay..."
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 11px', color: 'var(--text-1)', fontSize: 13.5, outline: 'none', width: '100%' }} />
                <datalist id="win-ver-edit">
                  <option value="10 Home" /><option value="10 Pro" /><option value="11 Home" /><option value="11 Pro" /><option value="11 Enterprise" />
                </datalist>
              </div>
              <Input label="Office" value={editForm.office_version} onChange={ef('office_version')} placeholder="Office 2021, 365..." />
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 }}>Địa chỉ mạng</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="MAC Address (LAN)" value={editForm.mac_address} onChange={ef('mac_address')} placeholder="AA:BB:CC:DD:EE:FF" />
              <Input label="WiFi MAC" value={editForm.wifi_mac} onChange={ef('wifi_mac')} placeholder="AA:BB:CC:DD:EE:FF" />
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 }}>Bảo hành</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Ngày mua" value={editForm.purchase_date} onChange={ef('purchase_date')} type="date" />
              <Input label="Hết bảo hành" value={editForm.warranty_expiry} onChange={ef('warranty_expiry')} type="date" />
            </div>

            <Input label="Ghi chú" value={editForm.note} onChange={ef('note')} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
              <Button variant="ghost" onClick={() => setShowEditAsset(false)}>Hủy</Button>
              <Button type="submit" disabled={editAssetMutation.isPending}>
                {editAssetMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add Login Modal ── */}
      {showAddLogin && (
        <Modal title="Thêm tài khoản đăng nhập" onClose={() => setShowAddLogin(false)}>
          <form onSubmit={e => { e.preventDefault(); addLoginMutation.mutate(loginForm) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Tên đăng nhập" value={loginForm.username} onChange={v => setLoginForm(p => ({ ...p, username: v }))} required placeholder="john.doe" />
            <Input label="Domain (nếu có)" value={loginForm.domain} onChange={v => setLoginForm(p => ({ ...p, domain: v }))} placeholder="SHARP-WORLD" />
            <Input label="Ghi chú" value={loginForm.note} onChange={v => setLoginForm(p => ({ ...p, note: v }))} placeholder="Tài khoản local, AD..." />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAddLogin(false)}>Hủy</Button>
              <Button type="submit" disabled={addLoginMutation.isPending}>Thêm</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

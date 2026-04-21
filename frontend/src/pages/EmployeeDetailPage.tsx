import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Employee, AssetAssignment, Department } from '../types'
import { Badge, Card, Spinner, Button, Modal, Input, Select } from '../components/ui'
import { format } from 'date-fns'
import { useAuthStore } from '../store/auth'
import toast from 'react-hot-toast'

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then(r => r.data),
  })

  const { data: assignments } = useQuery<AssetAssignment[]>({
    queryKey: ['employee-assignments', id],
    queryFn: () => api.get(`/employees/${id}/assignments`).then(r => r.data),
  })

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/catalog/departments').then(r => r.data),
  })

  const openEdit = () => {
    if (!employee) return
    setEditForm({
      full_name: employee.full_name ?? '',
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      department_id: employee.department_id ?? '',
      position: employee.position ?? '',
      status: employee.status ?? 'active',
      joined_date: employee.joined_date ?? '',
    })
    setShowEdit(true)
  }

  const editMutation = useMutation({
    mutationFn: (d: any) => api.patch(`/employees/${id}`, {
      ...d,
      joined_date: d.joined_date || null,
      department_id: d.department_id || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', id] })
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Đã cập nhật nhân viên')
      setShowEdit(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi cập nhật'),
  })

  const ef = (k: string) => (v: string) => setEditForm((p: any) => ({ ...p, [k]: v }))

  if (isLoading) return <Spinner />
  if (!employee) return <div style={{ color: 'var(--text-2)' }}>Không tìm thấy</div>

  const activeAssignments = assignments?.filter(a => a.status === 'active') ?? []
  const historyAssignments = assignments?.filter(a => a.status !== 'active') ?? []

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Quay lại</button>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px', background: 'var(--purple-dim)', border: '2px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, color: 'var(--purple)' }}>
              {employee.full_name[0]}
            </div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{employee.full_name}</div>
            <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>{employee.position ?? '—'}</div>
            <div style={{ marginTop: 10 }}><Badge status={employee.status} /></div>
            {user?.is_admin && (
              <Button size="sm" variant="ghost" onClick={openEdit} style={{ marginTop: 14, width: '100%' }}>✏ Chỉnh sửa</Button>
            )}
          </Card>

          <Card>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-2)' }}>THÔNG TIN</h3>
            {[
              ['Mã NV', employee.employee_code],
              ['Email', employee.email],
              ['SĐT', employee.phone],
              ['Phòng ban', employee.department?.name],
              ['Ngày vào', employee.joined_date ? format(new Date(employee.joined_date), 'dd/MM/yyyy') : null],
            ].map(([k, v]) => (
              <div key={k as string} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, color: v ? 'var(--text-1)' : 'var(--text-3)', fontFamily: k === 'Mã NV' ? 'var(--font-mono)' : undefined }}>{v ?? '—'}</div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
              Tài sản đang sử dụng
              <span style={{ marginLeft: 8, fontSize: 12, background: 'var(--blue-dim)', color: 'var(--blue)', padding: '2px 8px', borderRadius: 99 }}>{activeAssignments.length}</span>
            </h3>
            {!activeAssignments.length ? (
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Không có tài sản nào đang sử dụng</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeAssignments.map(a => (
                  <div key={a.id} onClick={() => navigate(`/assets/${a.asset_id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--bg-3)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{a.asset?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                        {a.asset?.asset_code} · Từ {format(new Date(a.assigned_date), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge status={a.asset?.status ?? 'assigned'} />
                      <span style={{ color: 'var(--text-3)' }}>›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Lịch sử</h3>
            {!historyAssignments.length ? (
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chưa có lịch sử</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {historyAssignments.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--bg-3)' }}>
                    <div>
                      <div style={{ fontSize: 13 }}>{a.asset?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                        {format(new Date(a.assigned_date), 'dd/MM/yy')} → {a.returned_date ? format(new Date(a.returned_date), 'dd/MM/yy') : '?'}
                      </div>
                    </div>
                    <Badge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Chỉnh sửa nhân viên" onClose={() => setShowEdit(false)}>
          <form onSubmit={e => { e.preventDefault(); editMutation.mutate(editForm) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Họ tên" value={editForm.full_name} onChange={ef('full_name')} required />
              <Input label="Email" value={editForm.email} onChange={ef('email')} required type="email" />
              <Input label="Điện thoại" value={editForm.phone} onChange={ef('phone')} />
              <Select label="Phòng ban" value={editForm.department_id} onChange={ef('department_id')}
                options={(departments ?? []).map(d => ({ value: d.id, label: d.name }))} />
              <Input label="Chức vụ" value={editForm.position} onChange={ef('position')} />
              <Select label="Trạng thái" value={editForm.status} onChange={ef('status')} options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng' },
                { value: 'resigned', label: 'Nghỉ việc' },
              ]} />
              <Input label="Ngày vào làm" value={editForm.joined_date} onChange={ef('joined_date')} type="date" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Hủy</Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

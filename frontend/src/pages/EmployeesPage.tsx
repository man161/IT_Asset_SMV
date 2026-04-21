import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Employee, Department, PaginatedResponse } from '../types'
import {
  PageHeader, SearchInput, Button, Card, Table, Tr, Td, Badge,
  Modal, Input, Select, Pagination, Spinner
} from '../components/ui'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'

export default function EmployeesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    employee_code: '', full_name: '', email: '', phone: '',
    department_id: '', position: '', status: 'active', joined_date: '',
  })

  const { data, isLoading } = useQuery<PaginatedResponse<Employee>>({
    queryKey: ['employees', page, search, filterDept, filterStatus],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), size: '20' })
      if (search) p.set('search', search)
      if (filterDept) p.set('department_id', filterDept)
      if (filterStatus) p.set('status', filterStatus)
      return api.get(`/employees?${p}`).then(r => r.data)
    },
  })

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/catalog/departments').then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/employees', {
      ...d, joined_date: d.joined_date || null, department_id: d.department_id || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Đã thêm nhân viên')
      setShowAdd(false)
      setForm({ employee_code: '', full_name: '', email: '', phone: '', department_id: '', position: '', status: 'active', joined_date: '' })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Lỗi'),
  })

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Nhân viên"
        subtitle={`${data?.total ?? 0} nhân viên`}
        action={user?.is_admin && <Button onClick={() => setShowAdd(true)}>+ Thêm nhân viên</Button>}
      />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Tên, email, mã NV..." />
          <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1) }} style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-1)', fontSize: 13,
          }}>
            <option value="">Tất cả phòng ban</option>
            {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-1)', fontSize: 13,
          }}>
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng</option>
            <option value="resigned">Nghỉ việc</option>
          </select>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        {isLoading ? <Spinner /> : (
          <Table headers={['Mã NV', 'Họ tên', 'Email', 'Phòng ban', 'Chức vụ', 'Trạng thái', '']} empty={!data?.items.length}>
            {data?.items.map(e => (
              <Tr key={e.id} onClick={() => navigate(`/employees/${e.id}`)}>
                <Td mono>{e.employee_code}</Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'var(--purple-dim)', border: '1px solid var(--purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: 'var(--purple)', flexShrink: 0,
                    }}>{e.full_name[0]}</div>
                    <span style={{ fontWeight: 500 }}>{e.full_name}</span>
                  </div>
                </Td>
                <Td><span style={{ color: 'var(--text-2)', fontSize: 12 }}>{e.email}</span></Td>
                <Td>{e.department?.name ?? '—'}</Td>
                <Td>{e.position ?? '—'}</Td>
                <Td><Badge status={e.status} /></Td>
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
        <Modal title="Thêm nhân viên" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Mã nhân viên" value={form.employee_code} onChange={f('employee_code')} required placeholder="NV001" />
              <Input label="Họ tên" value={form.full_name} onChange={f('full_name')} required placeholder="Nguyễn Văn A" />
              <Input label="Email" value={form.email} onChange={f('email')} required type="email" placeholder="nva@company.com" />
              <Input label="Điện thoại" value={form.phone} onChange={f('phone')} placeholder="0909..." />
              <Select label="Phòng ban" value={form.department_id} onChange={f('department_id')}
                options={(departments ?? []).map(d => ({ value: d.id, label: d.name }))} />
              <Input label="Chức vụ" value={form.position} onChange={f('position')} placeholder="Software Engineer" />
              <Input label="Ngày vào làm" value={form.joined_date} onChange={f('joined_date')} type="date" />
              <Select label="Trạng thái" value={form.status} onChange={f('status')} options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng' },
              ]} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Đang lưu...' : 'Thêm nhân viên'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

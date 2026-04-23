import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { AssetAssignment, PaginatedResponse } from '../types'
import { PageHeader, Card, Table, Tr, Td, Badge, Pagination, Spinner } from '../components/ui'
import { format } from 'date-fns'

export default function AssignmentsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('active')

  const { data, isLoading } = useQuery<PaginatedResponse<AssetAssignment>>({
    queryKey: ['assignments', page, filterStatus],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), size: '20' })
      if (filterStatus) p.set('status', filterStatus)
      return api.get(`/assignments?${p}`).then(r => r.data)
    },
  })

  // Bỏ tab "Thu hồi" (revoked) vì không có flow tạo ra trạng thái này
  const TABS = [
    { key: 'active',   label: 'Đang dùng' },
    { key: 'returned', label: 'Đã trả' },
    { key: '',         label: 'Tất cả' },
  ]

  return (
    <div>
      <PageHeader title="Bàn giao" subtitle={`${data?.total ?? 0} bản ghi`} />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setFilterStatus(t.key); setPage(1) }} style={{
              padding: '6px 14px', borderRadius: 'var(--radius)',
              background: filterStatus === t.key ? 'var(--blue)' : 'var(--bg-3)',
              color: filterStatus === t.key ? '#fff' : 'var(--text-2)',
              border: '1px solid', borderColor: filterStatus === t.key ? 'var(--blue)' : 'var(--border)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>{t.label}</button>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        {isLoading ? <Spinner /> : (
          <Table
            headers={['Mã BG', 'Tài sản', 'Nhân viên', 'Ngày bàn giao', 'Ngày trả', 'Trạng thái']}
            empty={!data?.items.length}
          >
            {data?.items.map(a => (
              <Tr key={a.id}>
                <Td mono><span style={{ fontSize: 12 }}>{a.handover_code}</span></Td>
                <Td>
                  <div style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--blue)' }}
                    onClick={() => navigate(`/assets/${a.asset_id}`)}>
                    {a.asset?.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{a.asset?.asset_code}</div>
                </Td>
                <Td>
                  <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${a.employee_id}`)}>
                    <div style={{ fontWeight: 500 }}>{a.employee?.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.employee?.department?.name}</div>
                  </div>
                </Td>
                <Td>{format(new Date(a.assigned_date), 'dd/MM/yyyy')}</Td>
                <Td>{a.returned_date ? format(new Date(a.returned_date), 'dd/MM/yyyy') : <span style={{ color: 'var(--text-3)' }}>—</span>}</Td>
                <Td><Badge status={a.status} /></Td>
              </Tr>
            ))}
          </Table>
        )}
        <div style={{ padding: '12px 16px' }}>
          <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
        </div>
      </Card>
    </div>
  )
}

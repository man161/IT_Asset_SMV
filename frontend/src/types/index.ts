export interface BusinessUnit {
  id: string; name: string; code?: string; description?: string; created_at: string
}

export interface Department {
  id: string; name: string; code?: string
  business_unit_id?: string; parent_id?: string; created_at: string
}

export interface Employee {
  id: string; employee_code: string; full_name: string; email: string
  phone?: string; department_id?: string; position?: string
  status: 'active' | 'inactive' | 'resigned'; joined_date?: string; created_at: string
  department?: Department
}

export interface AuthUser {
  id: string; username: string; email: string
  employee_id?: string; is_active: boolean; is_admin: boolean; created_at: string
}

export interface Location {
  id: string; name: string; building?: string; floor?: string; room?: string
  description?: string; created_at: string
}

export interface AssetType {
  id: string; name: string; code?: string; category: string
  description?: string; custom_fields?: Record<string, unknown>; created_at: string
}

export interface Asset {
  id: string; asset_code: string; name: string
  asset_type_id?: string; device_type?: string
  brand?: string; model?: string; serial_number?: string
  status: 'available' | 'assigned' | 'maintenance' | 'disposed'
  os?: string; os_version?: string; windows_version?: string; office_version?: string
  mac_address?: string; wifi_mac?: string
  purchase_date?: string; purchase_price?: number; warranty_expiry?: string
  location_id?: string; specs?: Record<string, unknown>; note?: string
  deleted_at?: string; created_at: string
  asset_type?: AssetType; location?: Location
  current_assignee?: Employee
}

export interface AssetAssignment {
  id: string; asset_id: string; employee_id: string; assigned_by?: string
  assigned_date: string; returned_date?: string
  status: 'active' | 'returned' | 'revoked'
  reason?: string; return_reason?: string; handover_code: string; created_at: string
  asset?: Asset; employee?: Employee
}

export interface DashboardStats {
  total_assets: number; available_assets: number; assigned_assets: number
  maintenance_assets: number; total_employees: number
  active_assignments: number; warranty_expiring_soon: number
}

export interface PaginatedResponse<T> {
  items: T[]; total: number; page: number; size: number; pages: number
}

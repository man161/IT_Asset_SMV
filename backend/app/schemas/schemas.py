from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, EmailStr


# ── Token ─────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    is_admin: bool


# ── Business Unit ─────────────────────────────────────────────
class BusinessUnitBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None

class BusinessUnitCreate(BusinessUnitBase): pass
class BusinessUnitUpdate(BusinessUnitBase): pass

class BusinessUnitOut(BusinessUnitBase):
    id: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Department ────────────────────────────────────────────────
class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None
    business_unit_id: Optional[str] = None
    parent_id: Optional[str] = None

class DepartmentCreate(DepartmentBase): pass
class DepartmentUpdate(DepartmentBase): pass

class DepartmentOut(DepartmentBase):
    id: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Employee ──────────────────────────────────────────────────
class EmployeeBase(BaseModel):
    employee_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[str] = None
    position: Optional[str] = None
    status: str = "active"
    joined_date: Optional[date] = None

class EmployeeCreate(EmployeeBase): pass
class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    joined_date: Optional[date] = None

class EmployeeOut(EmployeeBase):
    id: str
    created_at: datetime
    department: Optional[DepartmentOut] = None
    model_config = {"from_attributes": True}


# ── Auth User ─────────────────────────────────────────────────
class AuthUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    employee_id: Optional[str] = None
    is_admin: bool = False

class AuthUserOut(BaseModel):
    id: str
    username: str
    email: str
    employee_id: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Location ──────────────────────────────────────────────────
class LocationBase(BaseModel):
    name: str
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    description: Optional[str] = None

class LocationCreate(LocationBase): pass
class LocationOut(LocationBase):
    id: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Asset Type ────────────────────────────────────────────────
class AssetTypeBase(BaseModel):
    name: str
    code: Optional[str] = None
    category: str = "hardware"
    description: Optional[str] = None
    custom_fields: Optional[dict] = None

class AssetTypeCreate(AssetTypeBase): pass
class AssetTypeOut(AssetTypeBase):
    id: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Asset ─────────────────────────────────────────────────────
class AssetBase(BaseModel):
    asset_code: str
    name: str
    asset_type_id: Optional[str] = None
    device_type: Optional[str] = None          # laptop | desktop
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    status: str = "available"
    # OS & Software
    os: Optional[str] = None
    os_version: Optional[str] = None
    windows_version: Optional[str] = None
    office_version: Optional[str] = None
    # Network
    mac_address: Optional[str] = None
    wifi_mac: Optional[str] = None
    # Purchase & Warranty
    purchase_date: Optional[date] = None
    #purchase_price: Optional[float] = None
    warranty_expiry: Optional[date] = None
    location_id: Optional[str] = None
    specs: Optional[dict[str, Any]] = None
    note: Optional[str] = None

class AssetCreate(AssetBase): pass
class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type_id: Optional[str] = None
    device_type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    os: Optional[str] = None
    windows_version: Optional[str] = None
    os_version: Optional[str] = None
    office_version: Optional[str] = None
    mac_address: Optional[str] = None
    wifi_mac: Optional[str] = None
    purchase_date: Optional[date] = None
    #purchase_price: Optional[float] = None
    warranty_expiry: Optional[date] = None
    location_id: Optional[str] = None
    specs: Optional[dict[str, Any]] = None
    note: Optional[str] = None

class AssetOut(AssetBase):
    id: str
    deleted_at: Optional[datetime] = None
    created_at: datetime
    asset_type: Optional[AssetTypeOut] = None
    location: Optional[LocationOut] = None
    model_config = {"from_attributes": True}

class AssetWithAssignee(AssetOut):
    current_assignee: Optional[EmployeeOut] = None


# ── Asset Assignment ──────────────────────────────────────────
class AssignmentCreate(BaseModel):
    asset_id: str
    employee_id: str
    assigned_date: date
    reason: Optional[str] = None

class AssignmentReturn(BaseModel):
    returned_date: date
    return_reason: Optional[str] = None

class AssignmentOut(BaseModel):
    id: str
    asset_id: str
    employee_id: str
    assigned_by: Optional[str] = None
    assigned_date: date
    returned_date: Optional[date] = None
    status: str
    reason: Optional[str] = None
    return_reason: Optional[str] = None
    handover_code: str
    created_at: datetime
    asset: Optional[AssetOut] = None
    employee: Optional[EmployeeOut] = None
    model_config = {"from_attributes": True}


# ── Pagination ────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    size: int
    pages: int


# ── Dashboard Stats ───────────────────────────────────────────
class DashboardStats(BaseModel):
    total_assets: int
    available_assets: int
    assigned_assets: int
    maintenance_assets: int
    total_employees: int
    active_assignments: int
    warranty_expiring_soon: int  # trong 30 ngày

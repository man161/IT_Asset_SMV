import uuid
from datetime import datetime
from sqlalchemy import (
    String, Boolean, DateTime, Date, Text, Numeric,
    ForeignKey, JSON, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


# ── Business Units ────────────────────────────────────────────
class BusinessUnit(Base):
    __tablename__ = "business_units"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str | None] = mapped_column(String, unique=True)
    description: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    departments: Mapped[list["Department"]] = relationship(back_populates="business_unit")


# ── Departments ───────────────────────────────────────────────
class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str | None] = mapped_column(String, unique=True)
    business_unit_id: Mapped[str | None] = mapped_column(ForeignKey("business_units.id"))
    parent_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    business_unit: Mapped["BusinessUnit | None"] = relationship(back_populates="departments")
    employees: Mapped[list["Employee"]] = relationship(back_populates="department")


# ── Employees ─────────────────────────────────────────────────
class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    employee_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String)
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"))
    position: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="active")  # active|inactive|resigned
    joined_date: Mapped[datetime | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    department: Mapped["Department | None"] = relationship(back_populates="employees")
    auth_user: Mapped["AuthUser | None"] = relationship(back_populates="employee")
    assignments: Mapped[list["AssetAssignment"]] = relationship(back_populates="employee")


# ── Auth Users ────────────────────────────────────────────────
class AuthUser(Base):
    __tablename__ = "auth_users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    employee_id: Mapped[str | None] = mapped_column(ForeignKey("employees.id"), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    employee: Mapped["Employee | None"] = relationship(back_populates="auth_user")


# ── Locations ─────────────────────────────────────────────────
class Location(Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    building: Mapped[str | None] = mapped_column(String)
    floor: Mapped[str | None] = mapped_column(String)
    room: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    assets: Mapped[list["Asset"]] = relationship(back_populates="location")


# ── Asset Types ───────────────────────────────────────────────
class AssetType(Base):
    __tablename__ = "asset_types"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str | None] = mapped_column(String, unique=True)
    category: Mapped[str] = mapped_column(String, default="hardware")
    description: Mapped[str | None] = mapped_column(String)
    custom_fields: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    assets: Mapped[list["Asset"]] = relationship(back_populates="asset_type")


# ── Assets ────────────────────────────────────────────────────
class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    asset_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    asset_type_id: Mapped[str | None] = mapped_column(ForeignKey("asset_types.id"))
    device_type: Mapped[str | None] = mapped_column(String)           # laptop | desktop
    brand: Mapped[str | None] = mapped_column(String)
    model: Mapped[str | None] = mapped_column(String)
    serial_number: Mapped[str | None] = mapped_column(String, unique=True)
    status: Mapped[str] = mapped_column(String, default="available")
    # OS & Software
    os: Mapped[str | None] = mapped_column(String)                    # Windows 10, Windows 11, Ubuntu...
    os_version: Mapped[str | None] = mapped_column(String)            # OS version (22H2, Ventura 13.5...)
    windows_version: Mapped[str | None] = mapped_column(String)       # 10 Pro, 11 Home, 11 Pro...
    office_version: Mapped[str | None] = mapped_column(String)        # Office 2019, 365, None
    # Network
    mac_address: Mapped[str | None] = mapped_column(String)           # Ethernet MAC
    wifi_mac: Mapped[str | None] = mapped_column(String)              # WiFi MAC
    # Purchase & Warranty
    purchase_date: Mapped[datetime | None] = mapped_column(Date)
    #purchase_price: Mapped[float | None] = mapped_column(Numeric(15, 2))
    warranty_expiry: Mapped[datetime | None] = mapped_column(Date)
    location_id: Mapped[str | None] = mapped_column(ForeignKey("locations.id"))
    specs: Mapped[dict | None] = mapped_column(JSON)                  # CPU, RAM, Storage, GPU...
    note: Mapped[str | None] = mapped_column(Text)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    asset_type: Mapped["AssetType | None"] = relationship(back_populates="assets")
    location: Mapped["Location | None"] = relationship(back_populates="assets")
    assignments: Mapped[list["AssetAssignment"]] = relationship(back_populates="asset")
    events: Mapped[list["AssetEvent"]] = relationship(back_populates="asset")


# ── Asset Assignments ─────────────────────────────────────────
class AssetAssignment(Base):
    __tablename__ = "asset_assignments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id"), nullable=False)
    assigned_by: Mapped[str | None] = mapped_column(ForeignKey("auth_users.id"))
    assigned_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    returned_date: Mapped[datetime | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, default="active")  # active|returned|revoked
    reason: Mapped[str | None] = mapped_column(Text)
    return_reason: Mapped[str | None] = mapped_column(Text)
    handover_code: Mapped[str] = mapped_column(String, unique=True, default=lambda: f"HO-{uuid.uuid4().hex[:8].upper()}")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    asset: Mapped["Asset"] = relationship(back_populates="assignments")
    employee: Mapped["Employee"] = relationship(back_populates="assignments")


# ── Asset Events ──────────────────────────────────────────────
class AssetEvent(Base):
    __tablename__ = "asset_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"), nullable=False)
    employee_id: Mapped[str | None] = mapped_column(ForeignKey("employees.id"))
    performed_by: Mapped[str | None] = mapped_column(ForeignKey("auth_users.id"))
    action: Mapped[str] = mapped_column(String, nullable=False)
    old_value: Mapped[dict | None] = mapped_column(JSON)
    new_value: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    asset: Mapped["Asset"] = relationship(back_populates="events")


# ── Audit Logs ────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("auth_users.id"))
    table_name: Mapped[str] = mapped_column(String, nullable=False)
    record_id: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)  # create|update|delete
    old_data: Mapped[dict | None] = mapped_column(JSON)
    new_data: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ── Asset Logins ──────────────────────────────────────────────
class AssetLogin(Base):
    __tablename__ = "asset_logins"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"), nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False)
    domain: Mapped[str | None] = mapped_column(String)
    note: Mapped[str | None] = mapped_column(String)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("auth_users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

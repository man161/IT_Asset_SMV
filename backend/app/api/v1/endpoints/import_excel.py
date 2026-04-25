import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import (
    Asset, Employee, AssetAssignment, AssetLogin,
    Department, BusinessUnit, Location, AssetType
)
from app.core.deps import get_admin_user
from app.models.models import AuthUser
import pandas as pd
import io

router = APIRouter()


def gen_id(): return str(uuid.uuid4())


def get_or_create_bu(db, name: str) -> str:
    if not name or str(name).strip() in ('', 'nan', 'NaN'):
        return None
    name = str(name).strip()
    bu = db.query(BusinessUnit).filter(BusinessUnit.name == name).first()
    if not bu:
        bu = BusinessUnit(id=gen_id(), name=name, code=name[:20])
        db.add(bu); db.flush()
    return bu.id


def get_or_create_dept(db, name: str, bu_id: str = None) -> str:
    if not name or str(name).strip() in ('', 'nan', 'NaN'):
        return None
    name = str(name).strip()
    dept = db.query(Department).filter(Department.name == name).first()
    if not dept:
        dept = Department(id=gen_id(), name=name, business_unit_id=bu_id)
        db.add(dept); db.flush()
    return dept.id


def get_or_create_location(db, floor: str) -> str:
    if not floor or str(floor).strip() in ('', 'nan', 'NaN'):
        return None
    name = str(floor).strip()
    loc = db.query(Location).filter(Location.name == name).first()
    if not loc:
        loc = Location(id=gen_id(), name=name, floor=name)
        db.add(loc); db.flush()
    return loc.id


def get_or_create_asset_type(db, type_name: str) -> str:
    if not type_name or str(type_name).strip() in ('', 'nan', 'NaN'):
        return None
    name = str(type_name).strip()
    at = db.query(AssetType).filter(AssetType.name == name).first()
    if not at:
        at = AssetType(id=gen_id(), name=name, category="hardware")
        db.add(at); db.flush()
    return at.id


def safe_str(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, float) and pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ('', 'nan', 'nat', 'none'):
        return None
    return s


def safe_date(val):
    if val is None:
        return None
    try:
        if isinstance(val, float) and pd.isna(val):
            return None
        if isinstance(val, datetime):
            return val.date()
        parsed = pd.to_datetime(val, errors='coerce')
        if pd.isna(parsed):
            return None
        return parsed.date()
    except:
        return None


def generate_handover_code(db) -> str:
    from sqlalchemy import func
    last = db.query(func.max(AssetAssignment.handover_code)).filter(
        AssetAssignment.handover_code.like('SMVITBG-%')
    ).scalar()
    last_num = 0
    if last:
        try: last_num = int(last.split('-')[1])
        except: pass
    return f"SMVITBG-{last_num + 1:06d}"


@router.post("/preview")
async def preview_import(file: UploadFile = File(...), _: AuthUser = Depends(get_admin_user)):
    """Parse Excel, return preview data without saving to DB."""
    content = await file.read()
    try:
        xl = pd.ExcelFile(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Không đọc được file Excel: {str(e)}")

    sheets = xl.sheet_names
    result = {"sheets": sheets, "assets": [], "employees": [], "history": [], "errors": []}

    # ── Sheet SMV PC ──
    smv_sheet = next((s for s in sheets if 'SMV' in s.upper() and 'PC' in s.upper()), None)
    if smv_sheet:
        df = xl.parse(smv_sheet, header=0)
        for i, row in df.iterrows():
            pc_name = safe_str(row.get('PC Name'))
            if not pc_name:
                continue
            result["assets"].append({
                "row": i + 2,
                "asset_code": pc_name,
                "name": f"{safe_str(row.get('Brand Name')) or ''} {safe_str(row.get('PC Name')) or ''}".strip(),
                "brand": safe_str(row.get('Brand Name')),
                "serial_number": safe_str(row.get('Serial No.')),
                "device_type": safe_str(row.get('Type', '')),
                "mac_address": safe_str(row.get('MAC Address')),
                "wifi_mac": safe_str(row.get('WIFI MAC')),
                "os": safe_str(row.get('OS')),
                "windows_version": safe_str(row.get('Window')),
                "office_version": safe_str(row.get('Office')),
                "vendor": safe_str(row.get('Vendor')),
                "purchase_date": str(safe_date(row.get('Purchased Date'))) if safe_date(row.get('Purchased Date')) else None,
                "note": " | ".join(filter(None, [safe_str(row.get('Noted')), safe_str(row.get('Upgraded'))])) or None,
                "emp_code": safe_str(row.get('Emp.Code')),
                "full_name": safe_str(row.get('Full Name')),
                "email": safe_str(row.get('Email Address')),
                "bu": safe_str(row.get('BU')),
                "dept": safe_str(row.get('Dept.')),
                "floor": safe_str(row.get('FLOOR')),
                "job_title": safe_str(row.get('Job Title')),
                "setting_date": str(safe_date(row.get('Setting Date'))) if safe_date(row.get('Setting Date')) else None,
            })

    # ── Sheet CHANGE PC LIST ──
    change_sheet = next((s for s in sheets if 'CHANGE' in s.upper()), None)
    if change_sheet:
        df = xl.parse(change_sheet, header=0)
        for i, row in df.iterrows():
            pc = safe_str(row.get('PC Name'))
            if not pc:
                continue
            result["history"].append({
                "row": i + 2,
                "date": str(safe_date(row.get('DATE'))) if safe_date(row.get('DATE')) else None,
                "pc_name": pc,
                "emp_code": safe_str(row.get('Emp.Code')),
                "full_name": safe_str(row.get('Full Name')),
                "reason": safe_str(row.get('Reason')),
            })

    result["summary"] = {
        "total_assets": len(result["assets"]),
        "total_history": len(result["history"]),
        "assets_with_employee": sum(1 for a in result["assets"] if a.get("emp_code")),
    }
    return result


@router.post("/confirm")
async def confirm_import(file: UploadFile = File(...), db: Session = Depends(get_db), user: AuthUser = Depends(get_admin_user)):
    """Actually import data into DB."""
    content = await file.read()
    xl = pd.ExcelFile(io.BytesIO(content))
    sheets = xl.sheet_names

    stats = {"assets_created": 0, "assets_skipped": 0, "employees_created": 0,
             "employees_updated": 0, "assignments_created": 0, "history_created": 0, "errors": []}

    # ── 1. Import SMV PC ──
    smv_sheet = next((s for s in sheets if 'SMV' in s.upper() and 'PC' in s.upper()), None)
    asset_map = {}  # pc_name -> asset_id

    if smv_sheet:
        df = xl.parse(smv_sheet, header=0)
        for i, row in df.iterrows():
            try:
                pc_name = safe_str(row.get('PC Name'))
                if not pc_name:
                    continue

                # Check duplicate asset — vẫn thêm vào asset_map để CHANGE PC LIST dùng được
                existing_asset = db.query(Asset).filter(Asset.asset_code == pc_name).first()
                if existing_asset:
                    asset_map[pc_name] = existing_asset.id
                    stats["assets_skipped"] += 1
                    continue

                # Get/create related records
                bu_id = get_or_create_bu(db, row.get('BU'))
                dept_id = get_or_create_dept(db, row.get('Dept.'), bu_id)
                loc_id = get_or_create_location(db, row.get('FLOOR'))
                type_id = get_or_create_asset_type(db, row.get('Type'))

                # Create asset
                serial = safe_str(row.get('Serial No.'))
                # Bỏ qua serial nếu đã tồn tại
                if serial and db.query(Asset).filter(Asset.serial_number == serial).first():
                    serial = None

                asset = Asset(
                    id=gen_id(),
                    asset_code=pc_name,
                    name=f"{safe_str(row.get('Brand Name')) or ''} {pc_name}".strip(),
                    asset_type_id=type_id,
                    device_type=safe_str(row.get('Type', '')).lower() if safe_str(row.get('Type')) else None,
                    brand=safe_str(row.get('Brand Name')),
                    serial_number=serial,
                    mac_address=safe_str(row.get('MAC Address')),
                    wifi_mac=safe_str(row.get('WIFI MAC')),
                    os=safe_str(row.get('OS')),
                    windows_version=safe_str(row.get('Window')),
                    office_version=safe_str(row.get('Office')),
                    vendor=safe_str(row.get('Vendor')),
                    purchase_date=safe_date(row.get('Purchased Date')),
                    location_id=loc_id,
                    note=" | ".join(filter(None, [safe_str(row.get('Noted')), safe_str(row.get('Upgraded'))])) or None,
                    status="available",
                )
                db.add(asset)
                db.flush()
                asset_map[pc_name] = asset.id
                stats["assets_created"] += 1

                # Handle employee & assignment
                emp_code = safe_str(row.get('Emp.Code'))
                full_name = safe_str(row.get('Full Name'))
                if emp_code and full_name and not any(
                    x in full_name.upper() for x in ['SERVER', 'ROOM', 'OFFICE', 'MEETING']
                ):
                    emp = db.query(Employee).filter(Employee.employee_code == emp_code).first()
                    if emp:
                        # Update existing
                        emp.full_name = full_name
                        emp.email = safe_str(row.get('Email Address')) or emp.email
                        emp.position = safe_str(row.get('Job Title')) or emp.position
                        emp.department_id = dept_id or emp.department_id
                        stats["employees_updated"] += 1
                    else:
                        emp = Employee(
                            id=gen_id(),
                            employee_code=emp_code,
                            full_name=full_name,
                            email=safe_str(row.get("Email Address")) or f"{emp_code.lower().replace(' ', '')}@company.com",
                            position=safe_str(row.get('Job Title')),
                            department_id=dept_id,
                            status="active",
                        )
                        db.add(emp)
                        db.flush()
                        stats["employees_created"] += 1

                    # Create assignment
                    setting_date = safe_date(row.get('Setting Date'))
                    if setting_date:
                        code = generate_handover_code(db)
                        assignment = AssetAssignment(
                            id=gen_id(),
                            asset_id=asset.id,
                            employee_id=emp.id,
                            assigned_by=user.id,
                            assigned_date=setting_date,
                            status="active",
                            handover_code=code,
                            reason="Import từ Excel",
                        )
                        db.add(assignment)
                        asset.status = "assigned"
                        # Auto-add login account
                        db.add(AssetLogin(
                            id=gen_id(), asset_id=asset.id,
                            username=emp_code,
                            note=f"Tự động từ import — {full_name}",
                            created_by=user.id,
                        ))
                        stats["assignments_created"] += 1
                    db.flush()

            except Exception as e:
                stats["errors"].append(f"SMV PC row {i+2}: {str(e)[:120]}")
                db.rollback()  # reset session sau mỗi lỗi

    # ── 2. Import CHANGE PC LIST ──
    change_sheet = next((s for s in sheets if 'CHANGE' in s.upper()), None)
    if change_sheet:
        df = xl.parse(change_sheet, header=0)
        # Sort by DATE ascending for correct ordering
        df = df.dropna(subset=['PC Name'])
        df['_date'] = df['DATE'].apply(safe_date)
        df = df.sort_values('_date', na_position='last')

        # Track last return date per PC for assigned_date logic
        pc_last_return: dict = {}

        for i, row in df.iterrows():
            try:
                pc_name = safe_str(row.get('PC Name'))
                emp_code = safe_str(row.get('Emp.Code'))
                return_date = safe_date(row.get('DATE'))
                reason = safe_str(row.get('Reason'))

                if not pc_name or not emp_code or not return_date:
                    continue

                asset_id = asset_map.get(pc_name)
                if not asset_id:
                    a = db.query(Asset).filter(Asset.asset_code == pc_name).first()
                    if a:
                        asset_id = a.id
                        asset_map[pc_name] = a.id  # cache lại
                    else:
                        stats["errors"].append(f"CHANGE PC LIST row {i+2}: PC '{pc_name}' không tìm thấy trong DB")
                        continue

                emp = db.query(Employee).filter(Employee.employee_code == emp_code).first()
                if not emp:
                    full_name = safe_str(row.get('Full Name')) or emp_code
                    emp = Employee(
                        id=gen_id(), employee_code=emp_code,
                        full_name=full_name,
                        email=f"{emp_code.lower()}@company.com",
                        status="active",
                    )
                    db.add(emp)
                    db.flush()
                    stats["employees_created"] += 1

                # Determine assigned_date
                prev_return = pc_last_return.get(pc_name)
                if prev_return:
                    assigned_date = prev_return + timedelta(days=1)
                else:
                    assigned_date = return_date  # fallback: same as return

                # Check if assignment already exists
                exists = db.query(AssetAssignment).filter(
                    AssetAssignment.asset_id == asset_id,
                    AssetAssignment.employee_id == emp.id,
                    AssetAssignment.assigned_date == assigned_date,
                ).first()
                if exists:
                    pc_last_return[pc_name] = return_date
                    continue

                code = generate_handover_code(db)
                assignment = AssetAssignment(
                    id=gen_id(),
                    asset_id=asset_id,
                    employee_id=emp.id,
                    assigned_by=user.id,
                    assigned_date=assigned_date,
                    returned_date=return_date,
                    status="returned",
                    return_reason=reason or "Import từ lịch sử",
                    handover_code=code,
                    reason="Import từ Excel - lịch sử",
                )
                db.add(assignment)
                db.flush()
                pc_last_return[pc_name] = return_date
                stats["history_created"] += 1

            except Exception as e:
                stats["errors"].append(f"CHANGE PC LIST row {i+2}: {str(e)[:120]}")
                db.rollback()
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        stats["errors"].append(f"Final commit error: {str(e)[:200]}")
    return stats

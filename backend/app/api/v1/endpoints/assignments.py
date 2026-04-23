from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.models import AssetAssignment, Asset, AssetEvent, AuditLog, Employee, AssetLogin
from app.schemas.schemas import AssignmentCreate, AssignmentReturn, AssignmentOut, PaginatedResponse
from app.core.deps import get_current_user, get_admin_user
from app.models.models import AuthUser
import math

router = APIRouter()


def serialize(d):
    """Convert date/datetime objects to strings for JSON storage."""
    if not d:
        return d
    return {k: v.isoformat() if isinstance(v, (date, datetime)) else v
            for k, v in d.items()}


@router.get("", response_model=PaginatedResponse)
def list_assignments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    employee_id: str | None = None,
    asset_id: str | None = None,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
):
    q = db.query(AssetAssignment).options(
        joinedload(AssetAssignment.asset).joinedload(Asset.asset_type),
        joinedload(AssetAssignment.employee),
    )
    if status:
        q = q.filter(AssetAssignment.status == status)
    if employee_id:
        q = q.filter(AssetAssignment.employee_id == employee_id)
    if asset_id:
        q = q.filter(AssetAssignment.asset_id == asset_id)

    total = q.count()
    items = q.order_by(AssetAssignment.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return PaginatedResponse(items=[AssignmentOut.model_validate(a) for a in items], total=total, page=page, size=size, pages=math.ceil(total / size))


@router.post("", response_model=AssignmentOut)
def create_assignment(data: AssignmentCreate, db: Session = Depends(get_db), user: AuthUser = Depends(get_admin_user)):
    asset = db.query(Asset).filter(Asset.id == data.asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    if asset.status not in ("available", "maintenance"):
        raise HTTPException(400, f"Tài sản đang ở trạng thái '{asset.status}', không thể bàn giao")

    # Generate sequential handover code — dùng MAX để tránh trùng
    from sqlalchemy import func as sqlfunc
    last = db.query(sqlfunc.max(AssetAssignment.handover_code)).filter(
        AssetAssignment.handover_code.like('SMVITBG-%')
    ).scalar()
    if last:
        try:
            last_num = int(last.split('-')[1])
        except (IndexError, ValueError):
            last_num = 0
    else:
        last_num = 0
    handover_code = f"SMVITBG-{last_num + 1:06d}"

    assignment = AssetAssignment(
        asset_id=data.asset_id,
        employee_id=data.employee_id,
        assigned_by=user.id,
        assigned_date=data.assigned_date,
        reason=data.reason,
        status="active",
        handover_code=handover_code,
    )
    db.add(assignment)
    db.flush()  # generate ID before audit log

    asset.status = "assigned"

    # Tự động thêm tài khoản đăng nhập từ mã nhân viên (nếu chưa có)
    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if employee:
        existing_login = db.query(AssetLogin).filter(
            AssetLogin.asset_id == data.asset_id,
            AssetLogin.username == employee.employee_code
        ).first()
        if not existing_login:
            db.add(AssetLogin(
                asset_id=data.asset_id,
                username=employee.employee_code,
                note=f"Tự động từ bàn giao — {employee.full_name}",
                created_by=user.id,
            ))

    db.add(AssetEvent(
        asset_id=data.asset_id,
        employee_id=data.employee_id,
        performed_by=user.id,
        action="assign",
        new_value={"employee_id": data.employee_id, "date": str(data.assigned_date)},
        note=data.reason,
    ))
    db.add(AuditLog(user_id=user.id, table_name="asset_assignments", record_id=assignment.id,
                    action="create", new_data=serialize(data.model_dump())))

    db.commit()
    db.refresh(assignment)
    return db.query(AssetAssignment).options(
        joinedload(AssetAssignment.asset), joinedload(AssetAssignment.employee)
    ).filter(AssetAssignment.id == assignment.id).first()


@router.post("/{assignment_id}/return", response_model=AssignmentOut)
def return_assignment(assignment_id: str, data: AssignmentReturn, db: Session = Depends(get_db), user: AuthUser = Depends(get_admin_user)):
    assignment = db.query(AssetAssignment).filter(AssetAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    if assignment.status != "active":
        raise HTTPException(400, "Assignment is not active")

    # Validate returned_date >= assigned_date
    if data.returned_date < assignment.assigned_date:
        raise HTTPException(400, f"Ngày thu hồi ({data.returned_date}) không thể trước ngày bàn giao ({assignment.assigned_date})")

    assignment.status = "returned"
    assignment.returned_date = data.returned_date
    assignment.return_reason = data.return_reason

    asset = db.query(Asset).filter(Asset.id == assignment.asset_id).first()
    if asset:
        asset.status = "available"

    db.add(AssetEvent(
        asset_id=assignment.asset_id,
        employee_id=assignment.employee_id,
        performed_by=user.id,
        action="return",
        old_value={"status": "assigned"},
        new_value={"status": "available", "returned_date": str(data.returned_date)},
        note=data.return_reason,
    ))

    db.commit()
    db.refresh(assignment)
    return db.query(AssetAssignment).options(
        joinedload(AssetAssignment.asset), joinedload(AssetAssignment.employee)
    ).filter(AssetAssignment.id == assignment_id).first()


@router.get("/{assignment_id}", response_model=AssignmentOut)
def get_assignment(assignment_id: str, db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    a = db.query(AssetAssignment).options(
        joinedload(AssetAssignment.asset), joinedload(AssetAssignment.employee)
    ).filter(AssetAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(404, "Assignment not found")
    return a

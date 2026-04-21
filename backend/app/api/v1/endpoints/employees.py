from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.db.session import get_db
from app.models.models import Employee, AssetAssignment, Asset
from app.schemas.schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut, PaginatedResponse, AssignmentOut
from app.core.deps import get_current_user, get_admin_user
from app.models.models import AuthUser
import math

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
def list_employees(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    department_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
):
    q = db.query(Employee).options(joinedload(Employee.department))
    if search:
        q = q.filter(or_(
            Employee.full_name.ilike(f"%{search}%"),
            Employee.email.ilike(f"%{search}%"),
            Employee.employee_code.ilike(f"%{search}%"),
        ))
    if department_id:
        q = q.filter(Employee.department_id == department_id)
    if status:
        q = q.filter(Employee.status == status)

    total = q.count()
    items = q.order_by(Employee.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return PaginatedResponse(items=[EmployeeOut.model_validate(e) for e in items], total=total, page=page, size=size, pages=math.ceil(total / size))


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: str, db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    emp = db.query(Employee).options(joinedload(Employee.department)).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    return emp


@router.post("", response_model=EmployeeOut)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    if db.query(Employee).filter(Employee.email == data.email).first():
        raise HTTPException(400, "Email already exists")
    if db.query(Employee).filter(Employee.employee_code == data.employee_code).first():
        raise HTTPException(400, "Employee code already exists")
    emp = Employee(**data.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.patch("/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: str, data: EmployeeUpdate, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return emp


@router.get("/{employee_id}/assignments", response_model=list[AssignmentOut])
def employee_assignments(employee_id: str, db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    assignments = db.query(AssetAssignment).options(
        joinedload(AssetAssignment.asset),
        joinedload(AssetAssignment.employee),
    ).filter(AssetAssignment.employee_id == employee_id).order_by(AssetAssignment.created_at.desc()).all()
    return assignments

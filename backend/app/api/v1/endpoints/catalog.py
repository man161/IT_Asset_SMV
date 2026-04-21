from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Department, Location, AssetType, BusinessUnit
from app.schemas.schemas import (
    DepartmentCreate, DepartmentOut, DepartmentUpdate,
    LocationCreate, LocationOut,
    AssetTypeCreate, AssetTypeOut,
    BusinessUnitCreate, BusinessUnitOut,
)
from app.core.deps import get_current_user, get_admin_user
from app.models.models import AuthUser

router = APIRouter()


# ── Business Units ────────────────────────────────────────────
@router.get("/business-units", response_model=list[BusinessUnitOut])
def list_business_units(db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    return db.query(BusinessUnit).all()

@router.post("/business-units", response_model=BusinessUnitOut)
def create_business_unit(data: BusinessUnitCreate, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    bu = BusinessUnit(**data.model_dump())
    db.add(bu); db.commit(); db.refresh(bu)
    return bu


# ── Departments ───────────────────────────────────────────────
@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    return db.query(Department).all()

@router.post("/departments", response_model=DepartmentOut)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    dept = Department(**data.model_dump())
    db.add(dept); db.commit(); db.refresh(dept)
    return dept

@router.patch("/departments/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: str, data: DepartmentUpdate, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(dept, k, v)
    db.commit(); db.refresh(dept)
    return dept


# ── Locations ─────────────────────────────────────────────────
@router.get("/locations", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    return db.query(Location).all()

@router.post("/locations", response_model=LocationOut)
def create_location(data: LocationCreate, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    loc = Location(**data.model_dump())
    db.add(loc); db.commit(); db.refresh(loc)
    return loc

@router.delete("/locations/{loc_id}")
def delete_location(loc_id: str, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    loc = db.query(Location).filter(Location.id == loc_id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    db.delete(loc); db.commit()
    return {"message": "Deleted"}


# ── Asset Types ───────────────────────────────────────────────
@router.get("/asset-types", response_model=list[AssetTypeOut])
def list_asset_types(db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    return db.query(AssetType).all()

@router.post("/asset-types", response_model=AssetTypeOut)
def create_asset_type(data: AssetTypeCreate, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    at = AssetType(**data.model_dump())
    db.add(at); db.commit(); db.refresh(at)
    return at

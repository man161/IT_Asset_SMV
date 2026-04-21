from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from app.db.session import get_db
from app.models.models import Asset, AssetAssignment, AuditLog
from app.schemas.schemas import AssetCreate, AssetUpdate, AssetOut, AssetWithAssignee, PaginatedResponse
from app.core.deps import get_current_user, get_admin_user
from app.models.models import AuthUser
import math

router = APIRouter()


def _log(db, user_id, record_id, action, old=None, new=None):
    def serialize(d):
        if not d:
            return d
        return {k: str(v) if hasattr(v, 'isoformat') else v for k, v in d.items()}
    db.add(AuditLog(user_id=user_id, table_name="assets", record_id=record_id,
                    action=action, old_data=serialize(old), new_data=serialize(new)))


@router.get("", response_model=PaginatedResponse)
def list_assets(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    asset_type_id: str | None = None,
    location_id: str | None = None,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(get_current_user),
):
    q = db.query(Asset).options(
        joinedload(Asset.asset_type),
        joinedload(Asset.location),
    ).filter(Asset.deleted_at.is_(None))

    if search:
        q = q.filter(or_(
            Asset.name.ilike(f"%{search}%"),
            Asset.asset_code.ilike(f"%{search}%"),
            Asset.serial_number.ilike(f"%{search}%"),
            Asset.brand.ilike(f"%{search}%"),
            Asset.model.ilike(f"%{search}%"),
        ))
    if status:
        q = q.filter(Asset.status == status)
    if asset_type_id:
        q = q.filter(Asset.asset_type_id == asset_type_id)
    if location_id:
        q = q.filter(Asset.location_id == location_id)

    total = q.count()
    items = q.order_by(Asset.created_at.desc()).offset((page - 1) * size).limit(size).all()

    # Attach current assignee
    result = []
    for asset in items:
        active = db.query(AssetAssignment).filter(
            AssetAssignment.asset_id == asset.id,
            AssetAssignment.status == "active"
        ).first()
        d = AssetWithAssignee.model_validate(asset)
        if active:
            from app.models.models import Employee
            emp = db.query(Employee).filter(Employee.id == active.employee_id).first()
            d.current_assignee = emp
        result.append(d)

    return PaginatedResponse(items=result, total=total, page=page, size=size, pages=math.ceil(total / size))


@router.get("/{asset_id}", response_model=AssetWithAssignee)
def get_asset(asset_id: str, db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    asset = db.query(Asset).options(
        joinedload(Asset.asset_type), joinedload(Asset.location)
    ).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    active = db.query(AssetAssignment).filter(
        AssetAssignment.asset_id == asset_id, AssetAssignment.status == "active"
    ).first()
    result = AssetWithAssignee.model_validate(asset)
    if active:
        from app.models.models import Employee
        result.current_assignee = db.query(Employee).filter(Employee.id == active.employee_id).first()
    return result


@router.post("", response_model=AssetOut)
def create_asset(data: AssetCreate, db: Session = Depends(get_db), user: AuthUser = Depends(get_admin_user)):
    asset = Asset(**data.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    _log(db, user.id, asset.id, "create", new=data.model_dump())
    db.commit()
    return asset


@router.patch("/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: str, data: AssetUpdate, db: Session = Depends(get_db), user: AuthUser = Depends(get_admin_user)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    old = {c.name: getattr(asset, c.name) for c in Asset.__table__.columns}
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(asset, k, v)
    db.commit()
    db.refresh(asset)
    _log(db, user.id, asset_id, "update", old=old, new=data.model_dump(exclude_none=True))
    db.commit()
    return asset


@router.delete("/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db), user: AuthUser = Depends(get_admin_user)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    if asset.status == "assigned":
        raise HTTPException(400, "Cannot delete an assigned asset")
    asset.deleted_at = datetime.utcnow()
    _log(db, user.id, asset_id, "delete")
    db.commit()
    return {"message": "Asset deleted"}


@router.get("/stats/warranty-expiring")
def warranty_expiring(days: int = 30, db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    cutoff = datetime.utcnow().date() + timedelta(days=days)
    assets = db.query(Asset).filter(
        Asset.warranty_expiry <= cutoff,
        Asset.warranty_expiry >= datetime.utcnow().date(),
        Asset.deleted_at.is_(None)
    ).all()
    return assets

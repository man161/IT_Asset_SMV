from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Asset, Employee, AssetAssignment
from app.schemas.schemas import DashboardStats
from app.core.deps import get_current_user
from app.models.models import AuthUser

router = APIRouter()


@router.get("", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    total_assets = db.query(Asset).filter(Asset.deleted_at.is_(None)).count()
    available = db.query(Asset).filter(Asset.status == "available", Asset.deleted_at.is_(None)).count()
    assigned = db.query(Asset).filter(Asset.status == "assigned", Asset.deleted_at.is_(None)).count()
    maintenance = db.query(Asset).filter(Asset.status == "maintenance", Asset.deleted_at.is_(None)).count()
    total_employees = db.query(Employee).filter(Employee.status == "active").count()
    active_assignments = db.query(AssetAssignment).filter(AssetAssignment.status == "active").count()
    cutoff = datetime.utcnow().date() + timedelta(days=30)
    warranty_expiring = db.query(Asset).filter(
        Asset.warranty_expiry <= cutoff,
        Asset.warranty_expiry >= datetime.utcnow().date(),
        Asset.deleted_at.is_(None),
    ).count()

    return DashboardStats(
        total_assets=total_assets,
        available_assets=available,
        assigned_assets=assigned,
        maintenance_assets=maintenance,
        total_employees=total_employees,
        active_assignments=active_assignments,
        warranty_expiring_soon=warranty_expiring,
    )

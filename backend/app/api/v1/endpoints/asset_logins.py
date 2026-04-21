from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.models import AssetLogin, Asset
from app.core.deps import get_current_user, get_admin_user
from app.models.models import AuthUser

router = APIRouter()


class LoginCreate(BaseModel):
    username: str
    domain: Optional[str] = None
    note: Optional[str] = None


class LoginOut(BaseModel):
    id: str
    asset_id: str
    username: str
    domain: Optional[str] = None
    note: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


@router.get("/{asset_id}/logins", response_model=list[LoginOut])
def get_logins(asset_id: str, db: Session = Depends(get_db), _: AuthUser = Depends(get_current_user)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    logins = db.query(AssetLogin).filter(AssetLogin.asset_id == asset_id).order_by(AssetLogin.created_at).all()
    return [LoginOut(id=l.id, asset_id=l.asset_id, username=l.username, domain=l.domain,
                     note=l.note, created_at=str(l.created_at)) for l in logins]


@router.post("/{asset_id}/logins", response_model=LoginOut)
def add_login(asset_id: str, data: LoginCreate, db: Session = Depends(get_db), user: AuthUser = Depends(get_admin_user)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    login = AssetLogin(asset_id=asset_id, username=data.username, domain=data.domain,
                       note=data.note, created_by=user.id)
    db.add(login)
    db.commit()
    db.refresh(login)
    return LoginOut(id=login.id, asset_id=login.asset_id, username=login.username,
                    domain=login.domain, note=login.note, created_at=str(login.created_at))


@router.delete("/{asset_id}/logins/{login_id}")
def delete_login(asset_id: str, login_id: str, db: Session = Depends(get_db), _: AuthUser = Depends(get_admin_user)):
    login = db.query(AssetLogin).filter(AssetLogin.id == login_id, AssetLogin.asset_id == asset_id).first()
    if not login:
        raise HTTPException(404, "Login not found")
    db.delete(login)
    db.commit()
    return {"message": "Deleted"}

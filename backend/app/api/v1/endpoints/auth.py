from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import AuthUser
from app.schemas.schemas import Token, AuthUserCreate, AuthUserOut
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(AuthUser).filter(AuthUser.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account disabled")
    token = create_access_token({"user_id": user.id, "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/register", response_model=AuthUserOut)
def register(data: AuthUserCreate, db: Session = Depends(get_db)):
    if db.query(AuthUser).filter(AuthUser.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(AuthUser).filter(AuthUser.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = AuthUser(
        username=data.username,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        employee_id=data.employee_id,
        is_admin=data.is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=AuthUserOut)
def me(current_user: AuthUser = Depends(get_current_user)):
    return current_user

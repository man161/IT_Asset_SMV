from fastapi import APIRouter
from app.api.v1.endpoints import auth, assets, employees, assignments, catalog, dashboard, asset_logins

api_router = APIRouter()
api_router.include_router(auth.router,           prefix="/auth",        tags=["Auth"])
api_router.include_router(dashboard.router,      prefix="/dashboard",   tags=["Dashboard"])
api_router.include_router(assets.router,         prefix="/assets",      tags=["Assets"])
api_router.include_router(asset_logins.router,   prefix="/assets",      tags=["Asset Logins"])
api_router.include_router(employees.router,      prefix="/employees",   tags=["Employees"])
api_router.include_router(assignments.router,    prefix="/assignments",  tags=["Assignments"])
api_router.include_router(catalog.router,        prefix="/catalog",     tags=["Catalog"])

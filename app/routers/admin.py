from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db_session
from app.dependencies import get_current_admin
from app.models.admin import Admin
from app.schemas.admin import AdminLogin
from app.schemas.user import UserResponse, Token
from app.schemas.post import PostResponse
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["Admin Management"])

@router.post("/login", response_model=Token)
def login(login_data: AdminLogin, db: Session = Depends(get_db_session)):
    """
    Authenticate an admin and return a JWT access token.
    """
    token = AuthService.authenticate_admin(db, login_data)
    return Token(access_token=token)

@router.get("/users", response_model=list[UserResponse])
def get_users(
    limit: int = Query(10, ge=1, le=100, description="Number of records to retrieve"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Retrieve all registered users (paginated). Requires admin token.
    """
    return AdminService.list_users(db, limit=limit, offset=offset)

@router.get("/posts", response_model=list[PostResponse])
def get_posts(
    limit: int = Query(10, ge=1, le=100, description="Number of records to retrieve"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Retrieve all posts (paginated). Requires admin token.
    """
    return AdminService.list_posts(db, limit=limit, offset=offset)

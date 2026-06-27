from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db_session
from app.dependencies import get_current_admin
from app.models.admin import Admin
from app.schemas.admin import AdminLogin, AdminUserEdit
from app.schemas.user import UserResponse, Token
from app.schemas.post import PostResponse
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["Admin Management"])

@router.post("/login", response_model=Token)
def login(login_data: AdminLogin, db: Session = Depends(get_db_session)):
    return Token(access_token=AuthService.authenticate_admin(db, login_data))

@router.get("/users", response_model=list[UserResponse])
def get_users(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.list_users(db, limit=limit, offset=offset)

@router.get("/posts", response_model=list[PostResponse])
def get_posts(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.list_posts(db, limit=limit, offset=offset)

@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user(user_id: int, edit_data: AdminUserEdit, db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.edit_user(db, user_id, edit_data.username, edit_data.email, edit_data.account_status, edit_data.bio)

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.delete_user_account(db, user_id)

@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.delete_post(db, post_id)

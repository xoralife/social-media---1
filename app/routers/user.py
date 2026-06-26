from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db_session
from app.dependencies import get_current_user
from app.models.user import User
from app.models.post import Post
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserProfileResponse
from app.services.user_service import UserService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/user", tags=["User Profile"])

@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db_session)):
    return UserService.register_user(db, user_data)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db_session)):
    return Token(access_token=AuthService.authenticate_user(db, login_data))

@router.get("/profile/me", response_model=UserProfileResponse)
def get_my_profile(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    posts_count = db.query(Post).filter(Post.user_id == current_user.id).count()
    return UserProfileResponse(id=current_user.id, username=current_user.username, email=current_user.email, posts_count=posts_count)

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    posts_count = db.query(Post).filter(Post.user_id == user_id).count()
    return UserProfileResponse(id=user.id, username=user.username, email=user.email, posts_count=posts_count)

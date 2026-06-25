from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db_session
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.user_service import UserService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/user", tags=["User Profile"])

@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db_session)):
    """
    Register a new user account.
    """
    return UserService.register_user(db, user_data)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db_session)):
    """
    Authenticate a user and return a JWT access token.
    """
    token = AuthService.authenticate_user(db, login_data)
    return Token(access_token=token)

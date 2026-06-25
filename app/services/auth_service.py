from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import User, Admin
from app.schemas.user import UserLogin
from app.schemas.admin import AdminLogin
from app.utils.security import verify_password
from app.utils.jwt_handler import create_access_token

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> str:
        """
        Authenticate a regular user and return a JWT access token.
        """
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user or not verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Subject is the user ID, role is "user"
        return create_access_token(data={"sub": str(user.id), "role": "user"})

    @staticmethod
    def authenticate_admin(db: Session, login_data: AdminLogin) -> str:
        """
        Authenticate an admin and return a JWT access token.
        """
        admin = db.query(Admin).filter(Admin.username == login_data.username).first()
        if not admin or not verify_password(login_data.password, admin.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Subject is the admin ID, role is "admin"
        return create_access_token(data={"sub": str(admin.id), "role": "admin"})

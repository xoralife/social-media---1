from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password

class UserService:
    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """
        Create a new user after verifying that the email address is unique.
        """
        # Verify email uniqueness
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered"
            )
        
        # Create new user record with hashed password
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password=hash_password(user_data.password)
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

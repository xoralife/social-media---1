from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password

class UserService:
    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        db_user = User(username=user_data.username, email=user_data.email, password=hash_password(user_data.password))
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

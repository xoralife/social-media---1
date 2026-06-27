from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.post import Post
from app.models.message import Message

class AdminService:
    @staticmethod
    def list_users(db: Session, limit: int = 100, offset: int = 0) -> list[User]:
        return db.query(User).order_by(User.id.asc()).offset(offset).limit(limit).all()

    @staticmethod
    def list_posts(db: Session, limit: int = 100, offset: int = 0) -> list[Post]:
        return db.query(Post).order_by(Post.id.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def edit_user(db: Session, user_id: int, username: Optional[str] = None, email: Optional[str] = None, account_status: Optional[str] = None, bio: Optional[str] = None) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if username:
            user.username = username
        if email:
            user.email = email
        if account_status is not None:
            user.account_status = account_status
        if bio is not None:
            user.bio = bio
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_post(db: Session, post_id: int) -> dict:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        db.delete(post)
        db.commit()
        return {"message": "Post deleted successfully"}

    @staticmethod
    def delete_user_account(db: Session, user_id: int) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        db.query(Message).filter((Message.sender_id == user_id) | (Message.receiver_id == user_id)).delete()
        db.delete(user)
        db.commit()
        return {"message": "Account deleted successfully"}

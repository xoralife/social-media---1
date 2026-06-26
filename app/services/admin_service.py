from sqlalchemy.orm import Session
from app.models.user import User
from app.models.post import Post

class AdminService:
    @staticmethod
    def list_users(db: Session, limit: int = 100, offset: int = 0) -> list[User]:
        return db.query(User).order_by(User.id.asc()).offset(offset).limit(limit).all()

    @staticmethod
    def list_posts(db: Session, limit: int = 100, offset: int = 0) -> list[Post]:
        return db.query(Post).order_by(Post.id.desc()).offset(offset).limit(limit).all()

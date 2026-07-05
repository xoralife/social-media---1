from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.post import Post
from models.like import Like
from models.comment import Comment
from schemas.post import PostCreate
from schemas.comment import CommentCreate

class PostService:
    @staticmethod
    def create_post(db: Session, post_data: PostCreate, user_id: int) -> Post:
        db_post = Post(user_id=user_id, title=post_data.title, caption=post_data.caption, image_url=post_data.image_url, media_type=post_data.media_type)
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
        return db_post

    @staticmethod
    def like_post(db: Session, post_id: int, user_id: int) -> Like:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        if post.user_id == user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot like your own post")
        if db.query(Like).filter(Like.user_id == user_id, Like.post_id == post_id).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already liked")
        db_like = Like(user_id=user_id, post_id=post_id)
        db.add(db_like)
        db.commit()
        db.refresh(db_like)
        return db_like

    @staticmethod
    def comment_on_post(db: Session, comment_data: CommentCreate, user_id: int) -> Comment:
        if not db.query(Post).filter(Post.id == comment_data.post_id).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        db_comment = Comment(user_id=user_id, post_id=comment_data.post_id, comment=comment_data.comment)
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment

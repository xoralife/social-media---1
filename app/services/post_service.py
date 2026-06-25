from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.post import Post
from app.models.like import Like
from app.models.comment import Comment
from app.schemas.post import PostCreate
from app.schemas.comment import CommentCreate

class PostService:
    @staticmethod
    def create_post(db: Session, post_data: PostCreate, user_id: int) -> Post:
        """
        Create a new post linked to the authenticated user.
        """
        db_post = Post(
            user_id=user_id,
            title=post_data.title,
            caption=post_data.caption,
            image_url=post_data.image_url
        )
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
        return db_post

    @staticmethod
    def like_post(db: Session, post_id: int, user_id: int) -> Like:
        """
        Like a post, preventing duplicate likes by the same user.
        """
        # Ensure target post exists
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        # Check if the user has already liked this post (Duplicate Like Prevention)
        existing_like = db.query(Like).filter(
            Like.user_id == user_id,
            Like.post_id == post_id
        ).first()
        if existing_like:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post is already liked by this user"
            )
        
        # Save like
        db_like = Like(user_id=user_id, post_id=post_id)
        db.add(db_like)
        db.commit()
        db.refresh(db_like)
        return db_like

    @staticmethod
    def comment_on_post(db: Session, comment_data: CommentCreate, user_id: int) -> Comment:
        """
        Add a comment to an existing post.
        """
        # Ensure target post exists
        post = db.query(Post).filter(Post.id == comment_data.post_id).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        # Save comment
        db_comment = Comment(
            user_id=user_id,
            post_id=comment_data.post_id,
            comment=comment_data.comment
        )
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment

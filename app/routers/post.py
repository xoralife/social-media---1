from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db_session
from app.dependencies import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.like import Like
from app.models.comment import Comment
from app.schemas.post import PostCreate, PostResponse, PostDetailResponse
from app.schemas.like import LikeCreate, LikeResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.services.post_service import PostService
import os
import uuid

router = APIRouter(prefix="/user/post", tags=["Post Operations"])

@router.post("/upload-image")
def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join("app/uploads", filename)
    with open(path, "wb") as f:
        f.write(file.file.read())
    return {"image_url": f"/uploads/{filename}"}

@router.get("/list", response_model=list[PostDetailResponse])
def list_posts(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    posts = db.query(Post).order_by(Post.id.desc()).offset(offset).limit(limit).all()
    post_ids = [p.id for p in posts]
    like_counts = dict(db.query(Like.post_id, func.count(Like.id)).filter(Like.post_id.in_(post_ids)).group_by(Like.post_id).all())
    comment_counts = dict(db.query(Comment.post_id, func.count(Comment.id)).filter(Comment.post_id.in_(post_ids)).group_by(Comment.post_id).all())
    user_likes = set(l.post_id for l in db.query(Like).filter(Like.user_id == current_user.id, Like.post_id.in_(post_ids)).all())
    result = []
    for p in posts:
        result.append(PostDetailResponse(
            id=p.id,
            user_id=p.user_id,
            title=p.title,
            caption=p.caption,
            image_url=p.image_url,
            username=p.user.username if p.user else "unknown",
            profile_pic=p.user.profile_pic if p.user else None,
            like_count=like_counts.get(p.id, 0),
            comment_count=comment_counts.get(p.id, 0),
            is_liked=p.id in user_likes,
        ))
    return result

@router.get("/search", response_model=list[PostDetailResponse])
def search_posts(q: str = Query("", min_length=1), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    posts = db.query(Post).filter(
        Post.title.ilike(f"%{q}%") | Post.caption.ilike(f"%{q}%")
    ).order_by(Post.id.desc()).limit(limit).all()
    post_ids = [p.id for p in posts]
    like_counts = dict(db.query(Like.post_id, func.count(Like.id)).filter(Like.post_id.in_(post_ids)).group_by(Like.post_id).all())
    comment_counts = dict(db.query(Comment.post_id, func.count(Comment.id)).filter(Comment.post_id.in_(post_ids)).group_by(Comment.post_id).all())
    user_likes = set(l.post_id for l in db.query(Like).filter(Like.user_id == current_user.id, Like.post_id.in_(post_ids)).all())
    result = []
    for p in posts:
        result.append(PostDetailResponse(
            id=p.id,
            user_id=p.user_id,
            title=p.title,
            caption=p.caption,
            image_url=p.image_url,
            username=p.user.username if p.user else "unknown",
            profile_pic=p.user.profile_pic if p.user else None,
            like_count=like_counts.get(p.id, 0),
            comment_count=comment_counts.get(p.id, 0),
            is_liked=p.id in user_likes,
        ))
    return result

@router.post("/create", response_model=PostResponse, status_code=201)
def create_post(post_data: PostCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.create_post(db, post_data, current_user.id)

@router.post("/like", response_model=LikeResponse, status_code=201)
def like_post(like_data: LikeCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.like_post(db, like_data.post_id, current_user.id)

@router.post("/comment", response_model=CommentResponse, status_code=201)
def comment_post(comment_data: CommentCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.comment_on_post(db, comment_data, current_user.id)

@router.get("/{post_id}/comments", response_model=list[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.id.desc()).all()

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}

@router.get("/{post_id}", response_model=PostDetailResponse)
def get_post(post_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    like_count = db.query(Like).filter(Like.post_id == post_id).count()
    comment_count = db.query(Comment).filter(Comment.post_id == post_id).count()
    is_liked = db.query(Like).filter(Like.user_id == current_user.id, Like.post_id == post_id).first() is not None
    return PostDetailResponse(
        id=post.id,
        user_id=post.user_id,
        title=post.title,
        caption=post.caption,
        image_url=post.image_url,
        username=post.user.username if post.user else "unknown",
        profile_pic=post.user.profile_pic if post.user else None,
        like_count=like_count,
        comment_count=comment_count,
        is_liked=is_liked,
    )

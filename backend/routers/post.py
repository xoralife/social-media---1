from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db_session
from backend.dependencies import get_current_user
from backend.models.user import User
from backend.models.post import Post
from backend.models.like import Like
from backend.models.comment import Comment
from backend.models.favorite import Favorite
from backend.schemas.post import PostCreate, PostResponse, PostDetailResponse
from backend.schemas.like import LikeCreate, LikeResponse
from backend.schemas.comment import CommentCreate, CommentResponse
from backend.schemas.favorite import FavoriteCreate, FavoriteResponse
from backend.services.post_service import PostService
from backend.utils.cloudinary_upload import upload_file
import os
import uuid

router = APIRouter(prefix="/user/post", tags=["Post Operations"])

@router.post("/upload-image")
def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    from backend.config import settings
    data = file.file.read()
    if settings.CLOUDINARY_CLOUD_NAME:
        url = upload_file(data, folder="post_images")
    else:
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        path = os.path.join("backend/uploads", filename)
        with open(path, "wb") as f:
            f.write(data)
        url = f"/uploads/{filename}"
    return {"image_url": url}

@router.get("/list", response_model=list[PostDetailResponse])
def list_posts(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    posts = db.query(Post).order_by(Post.id.desc()).offset(offset).limit(limit).all()
    post_ids = [p.id for p in posts]
    like_counts = dict(db.query(Like.post_id, func.count(Like.id)).filter(Like.post_id.in_(post_ids)).group_by(Like.post_id).all())
    comment_counts = dict(db.query(Comment.post_id, func.count(Comment.id)).filter(Comment.post_id.in_(post_ids)).group_by(Comment.post_id).all())
    user_likes = set(l.post_id for l in db.query(Like).filter(Like.user_id == current_user.id, Like.post_id.in_(post_ids)).all())
    user_favorites = set(f.post_id for f in db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.post_id.in_(post_ids)).all())
    result = []
    for p in posts:
        result.append(PostDetailResponse(
            id=p.id,
            user_id=p.user_id,
            title=p.title,
            caption=p.caption,
            image_url=p.image_url,
            media_type=p.media_type,
            username=p.user.username if p.user else "unknown",
            profile_pic=p.user.profile_pic if p.user else None,
            like_count=like_counts.get(p.id, 0),
            comment_count=comment_counts.get(p.id, 0),
            is_liked=p.id in user_likes,
            is_favorited=p.id in user_favorites,
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
    user_favorites = set(f.post_id for f in db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.post_id.in_(post_ids)).all())
    result = []
    for p in posts:
        result.append(PostDetailResponse(
            id=p.id,
            user_id=p.user_id,
            title=p.title,
            caption=p.caption,
            image_url=p.image_url,
            media_type=p.media_type,
            username=p.user.username if p.user else "unknown",
            profile_pic=p.user.profile_pic if p.user else None,
            like_count=like_counts.get(p.id, 0),
            comment_count=comment_counts.get(p.id, 0),
            is_liked=p.id in user_likes,
            is_favorited=p.id in user_favorites,
        ))
    return result

@router.post("/create", response_model=PostResponse, status_code=201)
def create_post(post_data: PostCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.create_post(db, post_data, current_user.id)

@router.post("/like", response_model=LikeResponse, status_code=201)
def like_post(like_data: LikeCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.like_post(db, like_data.post_id, current_user.id)

@router.delete("/like/{post_id}")
def unlike_post(post_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    existing = db.query(Like).filter(Like.user_id == current_user.id, Like.post_id == post_id).first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not liked")
    db.delete(existing)
    db.commit()
    return {"message": "Unliked successfully"}

@router.post("/favorite", response_model=FavoriteResponse, status_code=201)
def favorite_post(fav_data: FavoriteCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == fav_data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    existing = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.post_id == fav_data.post_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already favorited")
    favorite = Favorite(user_id=current_user.id, post_id=fav_data.post_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite

@router.delete("/favorite/{post_id}")
def unfavorite_post(post_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    existing = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.post_id == post_id).first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not favorited")
    db.delete(existing)
    db.commit()
    return {"message": "Unfavorited successfully"}

@router.get("/favorites", response_model=list[PostDetailResponse])
def get_favorites(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    favorites = db.query(Favorite).filter(Favorite.user_id == current_user.id).order_by(Favorite.id.desc()).all()
    post_ids = [f.post_id for f in favorites]
    posts = db.query(Post).filter(Post.id.in_(post_ids)).all()
    posts_map = {p.id: p for p in posts}
    like_counts = dict(db.query(Like.post_id, func.count(Like.id)).filter(Like.post_id.in_(post_ids)).group_by(Like.post_id).all())
    comment_counts = dict(db.query(Comment.post_id, func.count(Comment.id)).filter(Comment.post_id.in_(post_ids)).group_by(Comment.post_id).all())
    user_likes = set(l.post_id for l in db.query(Like).filter(Like.user_id == current_user.id, Like.post_id.in_(post_ids)).all())
    result = []
    for f in favorites:
        p = posts_map.get(f.post_id)
        if p:
            result.append(PostDetailResponse(
                id=p.id,
                user_id=p.user_id,
                title=p.title,
                caption=p.caption,
                image_url=p.image_url,
                media_type=p.media_type,
                username=p.user.username if p.user else "unknown",
                profile_pic=p.user.profile_pic if p.user else None,
                like_count=like_counts.get(p.id, 0),
                comment_count=comment_counts.get(p.id, 0),
                is_liked=p.id in user_likes,
                is_favorited=True,
            ))
    return result

@router.get("/liked", response_model=list[PostDetailResponse])
def get_liked_posts(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    liked = db.query(Like).filter(Like.user_id == current_user.id).order_by(Like.id.desc()).all()
    post_ids = [l.post_id for l in liked]
    posts = db.query(Post).filter(Post.id.in_(post_ids)).all()
    posts_map = {p.id: p for p in posts}
    like_counts = dict(db.query(Like.post_id, func.count(Like.id)).filter(Like.post_id.in_(post_ids)).group_by(Like.post_id).all())
    comment_counts = dict(db.query(Comment.post_id, func.count(Comment.id)).filter(Comment.post_id.in_(post_ids)).group_by(Comment.post_id).all())
    user_favorites = set(f.post_id for f in db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.post_id.in_(post_ids)).all())
    result = []
    for l in liked:
        p = posts_map.get(l.post_id)
        if p:
            result.append(PostDetailResponse(
                id=p.id,
                user_id=p.user_id,
                title=p.title,
                caption=p.caption,
                image_url=p.image_url,
                media_type=p.media_type,
                username=p.user.username if p.user else "unknown",
                profile_pic=p.user.profile_pic if p.user else None,
                like_count=like_counts.get(p.id, 0),
                comment_count=comment_counts.get(p.id, 0),
                is_liked=True,
                is_favorited=p.id in user_favorites,
            ))
    return result

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
    is_favorited = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.post_id == post_id).first() is not None
    return PostDetailResponse(
        id=post.id,
        user_id=post.user_id,
        title=post.title,
        caption=post.caption,
        image_url=post.image_url,
        media_type=post.media_type,
        username=post.user.username if post.user else "unknown",
        profile_pic=post.user.profile_pic if post.user else None,
        like_count=like_count,
        comment_count=comment_count,
        is_liked=is_liked,
        is_favorited=is_favorited,
    )

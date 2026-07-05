from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db_session
from dependencies import get_current_admin
from models.admin import Admin
from models.user import User
from models.post import Post
from models.like import Like
from models.comment import Comment
from models.follow import Follow
from schemas.admin import AdminLogin, AdminUserEdit
from schemas.user import UserResponse, Token
from schemas.post import PostResponse
from services.admin_service import AdminService
from services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["Admin Management"])

@router.post("/login", response_model=Token)
def login(login_data: AdminLogin, db: Session = Depends(get_db_session)):
    return Token(access_token=AuthService.authenticate_admin(db, login_data))

@router.get("/users", response_model=list[UserResponse])
def get_users(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.list_users(db, limit=limit, offset=offset)

@router.get("/posts", response_model=list[PostResponse])
def get_posts(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.list_posts(db, limit=limit, offset=offset)

@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user(user_id: int, edit_data: AdminUserEdit, db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.edit_user(db, user_id, edit_data.username, edit_data.email, edit_data.account_status, edit_data.bio)

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.delete_user_account(db, user_id)

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    total_users = db.query(User).count()
    total_posts = db.query(Post).count()
    total_likes = db.query(Like).count()
    total_comments = db.query(Comment).count()
    total_follows = db.query(Follow).count()

    user_statuses = db.query(User.account_status, func.count(User.id)).group_by(User.account_status).all()
    status_breakdown = {r[0] or "Active": r[1] for r in user_statuses}

    most_liked = db.query(Post.id, Post.title, Post.image_url, func.count(Like.id).label("cnt")) \
        .outerjoin(Like, Like.post_id == Post.id) \
        .group_by(Post.id) \
        .order_by(func.count(Like.id).desc()) \
        .limit(5).all()
    top_posts = [{"id": p.id, "title": p.title, "likes": p.cnt} for p in most_liked]

    most_commented = db.query(Post.id, Post.title, Post.image_url, func.count(Comment.id).label("cnt")) \
        .outerjoin(Comment, Comment.post_id == Post.id) \
        .group_by(Post.id) \
        .order_by(func.count(Comment.id).desc()) \
        .limit(5).all()
    top_commented = [{"id": p.id, "title": p.title, "comments": p.cnt} for p in most_commented]

    top_followed = db.query(User.id, User.username, User.profile_pic, func.count(Follow.follower_id).label("cnt")) \
        .outerjoin(Follow, Follow.following_id == User.id) \
        .group_by(User.id) \
        .order_by(func.count(Follow.follower_id).desc()) \
        .limit(5).all()
    most_followed = [{"id": u.id, "username": u.username, "profile_pic": u.profile_pic, "followers": u.cnt} for u in top_followed]

    return {
        "total_users": total_users,
        "total_posts": total_posts,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_follows": total_follows,
        "user_status_breakdown": status_breakdown,
        "top_liked_posts": top_posts,
        "top_commented_posts": top_commented,
        "most_followed_users": most_followed,
    }

@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db_session), current_admin: Admin = Depends(get_current_admin)):
    return AdminService.delete_post(db, post_id)

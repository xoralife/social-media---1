from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db_session
from app.dependencies import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.follow import Follow
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserProfileResponse
from app.services.user_service import UserService
from app.services.auth_service import AuthService
import os
import uuid

router = APIRouter(prefix="/user", tags=["User Profile"])

@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db_session)):
    return UserService.register_user(db, user_data)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db_session)):
    return Token(access_token=AuthService.authenticate_user(db, login_data))

@router.post("/upload-pic")
def upload_profile_pic(file: UploadFile = File(...), db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join("app/uploads", filename)
    with open(path, "wb") as f:
        f.write(file.file.read())
    current_user.profile_pic = f"/uploads/{filename}"
    db.commit()
    return {"profile_pic": current_user.profile_pic}

@router.get("/profile/me", response_model=UserProfileResponse)
def get_my_profile(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    posts_count = db.query(Post).filter(Post.user_id == current_user.id).count()
    followers_count = db.query(Follow).filter(Follow.following_id == current_user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == current_user.id).count()
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        bio=current_user.bio,
        profile_pic=current_user.profile_pic,
        posts_count=posts_count,
        followers_count=followers_count,
        following_count=following_count,
        is_following=False,
    )

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    posts_count = db.query(Post).filter(Post.user_id == user_id).count()
    followers_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    is_following = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first() is not None
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        bio=user.bio,
        profile_pic=user.profile_pic,
        posts_count=posts_count,
        followers_count=followers_count,
        following_count=following_count,
    is_following=is_following,
        )

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None

@router.put("/profile/update", response_model=UserResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    if data.username:
        current_user.username = data.username
    if data.bio is not None:
        current_user.bio = data.bio
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/follow/{user_id}")
def follow_user(user_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already following")
    follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()
    return {"message": "Followed successfully"}

@router.post("/unfollow/{user_id}")
def unfollow_user(user_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not following")
    db.delete(existing)
    db.commit()
    return {"message": "Unfollowed successfully"}

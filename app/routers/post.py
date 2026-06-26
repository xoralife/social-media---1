from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db_session
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.post import PostCreate, PostResponse
from app.schemas.like import LikeCreate, LikeResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.services.post_service import PostService

router = APIRouter(prefix="/user/post", tags=["Post Operations"])

@router.post("/create", response_model=PostResponse, status_code=201)
def create_post(post_data: PostCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.create_post(db, post_data, current_user.id)

@router.post("/like", response_model=LikeResponse, status_code=201)
def like_post(like_data: LikeCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.like_post(db, like_data.post_id, current_user.id)

@router.post("/comment", response_model=CommentResponse, status_code=201)
def comment_post(comment_data: CommentCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    return PostService.comment_on_post(db, comment_data, current_user.id)
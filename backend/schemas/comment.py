from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class CommentCreate(BaseModel):
    post_id: int
    comment: str = Field(..., min_length=1)
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    comment: str
    parent_id: Optional[int] = None
    username: Optional[str] = None
    profile_pic: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

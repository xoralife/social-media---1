from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    caption: Optional[str] = None
    image_url: str = Field(..., max_length=255)

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class PostDetailResponse(PostResponse):
    username: str = ""
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False

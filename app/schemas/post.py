from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    caption: Optional[str] = Field(None, description="Optional caption for the post")
    image_url: str = Field(..., max_length=255, description="URL of the post image")

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

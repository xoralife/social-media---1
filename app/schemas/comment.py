from pydantic import BaseModel, Field, ConfigDict

class CommentCreate(BaseModel):
    post_id: int
    comment: str = Field(..., min_length=1, description="Comment text content")

class CommentResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    comment: str

    model_config = ConfigDict(from_attributes=True)

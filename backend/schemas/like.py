from pydantic import BaseModel, ConfigDict

class LikeCreate(BaseModel):
    post_id: int

class LikeResponse(BaseModel):
    id: int
    user_id: int
    post_id: int

    model_config = ConfigDict(from_attributes=True)

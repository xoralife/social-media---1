from pydantic import BaseModel, ConfigDict

class FavoriteCreate(BaseModel):
    post_id: int

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    post_id: int

    model_config = ConfigDict(from_attributes=True)

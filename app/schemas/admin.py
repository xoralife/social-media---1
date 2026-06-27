from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class AdminBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)

class AdminCreate(AdminBase):
    password: str = Field(..., min_length=6)

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminResponse(BaseModel):
    id: int
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)

class AdminUserEdit(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    account_status: Optional[str] = None
    bio: Optional[str] = None

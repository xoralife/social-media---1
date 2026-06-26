from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    user_id: int
    username: str
    profile_pic: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int = 0

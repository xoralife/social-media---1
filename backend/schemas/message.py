from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    receiver_id: int
    content: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    user_id: int
    username: str
    profile_pic: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: datetime
    unread_count: int = 0

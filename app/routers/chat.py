from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.database import get_db_session
from app.dependencies import get_current_user
from app.models.user import User
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageResponse, ConversationResponse
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    sub = db.query(
        Message.receiver_id.label("other_id")
    ).filter(Message.sender_id == current_user.id).union(
        db.query(Message.sender_id.label("other_id")).filter(Message.receiver_id == current_user.id)
    ).subquery()

    conversations = []
    for row in db.query(sub.c.other_id.distinct()).all():
        other_id = row[0]
        other = db.query(User).filter(User.id == other_id).first()
        if not other:
            continue
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == other_id),
                and_(Message.sender_id == other_id, Message.receiver_id == current_user.id),
            )
        ).order_by(desc(Message.created_at)).first()
        if not last_msg:
            continue
        unread = db.query(Message).filter(
            Message.sender_id == other_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False,
        ).count()
        conversations.append(ConversationResponse(
            user_id=other.id,
            username=other.username,
            profile_pic=other.profile_pic,
            last_message=last_msg.content,
            last_message_time=last_msg.created_at,
            unread_count=unread,
        ))
    return sorted(conversations, key=lambda c: c.last_message_time, reverse=True)

@router.get("/messages/{user_id}", response_model=list[MessageResponse])
def get_messages(user_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    other = db.query(User).filter(User.id == user_id).first()
    if not other:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).all()
    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False,
    ).update({Message.is_read: True})
    db.commit()
    return messages

@router.post("/send", response_model=MessageResponse, status_code=201)
def send_message(msg_data: MessageCreate, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    other = db.query(User).filter(User.id == msg_data.receiver_id).first()
    if not other:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    msg = Message(sender_id=current_user.id, receiver_id=msg_data.receiver_id, content=msg_data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False,
    ).count()
    return {"unread_count": count}

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from database import get_db_session
from dependencies import get_current_user
from models.user import User
from models.message import Message
from schemas.message import MessageCreate, MessageResponse, ConversationResponse
from datetime import datetime
import os, uuid
from config import settings, UPLOAD_DIR
from utils.cloudinary_upload import upload_file

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
            last_message="🎤 Voice message" if last_msg.media_type == "voice" else last_msg.content,
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
    if not msg_data.content and not msg_data.media_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message must have content or media")
    msg = Message(
        sender_id=current_user.id,
        receiver_id=msg_data.receiver_id,
        content=msg_data.content,
        media_type=msg_data.media_type,
        media_url=msg_data.media_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/upload-voice")
def upload_voice(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    data = file.file.read()
    if settings.CLOUDINARY_CLOUD_NAME:
        url = upload_file(data, folder="voice_messages")
    else:
        ext = file.filename.split(".")[-1] if "." in file.filename else "webm"
        filename = f"{uuid.uuid4()}.{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        with open(path, "wb") as f:
            f.write(data)
        url = f"/uploads/{filename}"
    return {"media_url": url}

@router.delete("/message/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete messages you sent or received")
    db.delete(msg)
    db.commit()
    return {"message": "Message deleted successfully"}

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False,
    ).count()
    return {"unread_count": count}

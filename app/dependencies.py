from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db_session
from app.utils.jwt_handler import decode_access_token
from app.models import User, Admin

security = HTTPBearer()

def _get_current_user(credentials: HTTPAuthorizationCredentials, db: Session, role: str, model):
    payload = decode_access_token(credentials.credentials)
    if not payload or payload.get("role") != role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    try:
        return db.query(model).filter(model.id == int(payload["sub"])).first()
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db_session)):
    user = _get_current_user(credentials, db, "user", User)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db_session)):
    admin = _get_current_user(credentials, db, "admin", Admin)
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
    return admin

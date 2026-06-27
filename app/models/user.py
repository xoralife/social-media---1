from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(Text, nullable=False)
    account_status = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    profile_pic = Column(String(500), nullable=True)

    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    following = relationship("Follow", foreign_keys="[Follow.follower_id]", back_populates="follower", cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="[Follow.following_id]", back_populates="following", cascade="all, delete-orphan")

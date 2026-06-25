from sqlalchemy import Column, BigInteger, String, Text
from app.database import Base

class Admin(Base):
    __tablename__ = "admin"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(Text, nullable=False)
    full_name = Column(String(255), nullable=False)

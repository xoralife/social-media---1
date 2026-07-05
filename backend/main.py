import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from database import engine, Base, SessionLocal
from routers import user, post, admin, chat
from models.admin import Admin
from utils.security import hash_password
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("posts")]
    if "media_type" not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE posts ADD COLUMN media_type VARCHAR(10) DEFAULT 'image'"))
            conn.commit()
        print("Migration: added media_type column to posts table")
    if "favorites" not in inspector.get_table_names():
        Base.metadata.create_all(bind=engine)
        print("Migration: created favorites table")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(Admin).first():
            db.add(Admin(username="admin", password=hash_password("admin123"), full_name="Default Administrator"))
            db.commit()
    except Exception as e:
        print(f"Warning: Could not seed default admin: {e}")
    finally:
        db.close()
    yield

app = FastAPI(title="Instagram-style Backend API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not settings.CLOUDINARY_CLOUD_NAME:
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(user.router)
app.include_router(post.router)
app.include_router(admin.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Instagram-style Backend API", "docs_url": "/docs", "redoc_url": "/redoc"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)

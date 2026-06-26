from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base, SessionLocal
from app.routers import user, post, admin, chat
from app.models.admin import Admin
from app.utils.security import hash_password
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
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

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

os.makedirs("app/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

app.include_router(user.router)
app.include_router(post.router)
app.include_router(admin.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Instagram-style Backend API", "docs_url": "/docs", "redoc_url": "/redoc"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

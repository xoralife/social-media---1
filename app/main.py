from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine, Base, SessionLocal
from app.routers import user, post, admin
from app.models.admin import Admin
from app.utils.security import hash_password

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create tables if they do not exist
    Base.metadata.create_all(bind=engine)
    
    # Seed a default admin if none exists, allowing immediate out-of-the-box testing
    db = SessionLocal()
    try:
        admin_exists = db.query(Admin).first()
        if not admin_exists:
            default_admin = Admin(
                username="admin",
                password=hash_password("adminpassword123"),
                full_name="Default Administrator"
            )
            db.add(default_admin)
            db.commit()
    except Exception as e:
        print(f"Warning: Could not seed default admin: {e}")
    finally:
        db.close()
        
    yield

# Create the FastAPI app
app = FastAPI(
    title="Instagram-style Backend API",
    description=(
        "A complete, production-ready backend API mimicking Instagram operations. "
        "Built using Python, FastAPI, SQLAlchemy ORM, Pydantic v2, and JWT Authentication."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Register routers
app.include_router(user.router)
app.include_router(post.router)
app.include_router(admin.router)

@app.get("/", tags=["Root"])
def root():
    """
    API Root Endpoint.
    """
    return {
        "message": "Welcome to the Instagram-style Backend API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import auth, ai, user, blocks
from app.db.mongo import connect_to_mongo, close_mongo_connection, create_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Hydra Notes API...")
    settings = get_settings()
    if settings.mongodb_uri:
        await connect_to_mongo()
        await create_indexes()
    else:
        print("Warning: MONGODB_URI not configured, skipping MongoDB connection")
    yield
    # Shutdown
    print("Shutting down Hydra Notes API...")
    await close_mongo_connection()


app = FastAPI(
    title="Hydra Notes API",
    description="AI-powered hierarchical note-taking backend",
    version="0.1.0",
    lifespan=lifespan,
)

settings = get_settings()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(blocks.router, prefix="/api/blocks", tags=["blocks"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import auth, ai, user, blocks
from app.api.websockets import ai_stream_router
from app.db.mongo import connect_to_mongo, close_mongo_connection, create_indexes, is_mongo_connected

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Hydra Notes API...")
    settings = get_settings()

    # Log configuration (without secrets)
    logger.info(f"MONGODB_URI configured: {bool(settings.mongodb_uri)}")
    logger.info(f"MONGODB_DATABASE: {settings.mongodb_database}")

    if settings.mongodb_uri:
        try:
            await connect_to_mongo()
            await create_indexes()
            logger.info("MongoDB connection established successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            # Re-raise to prevent app from starting with broken DB
            raise
    else:
        logger.warning("MONGODB_URI not configured, skipping MongoDB connection")

    yield

    # Shutdown
    logger.info("Shutting down Hydra Notes API...")
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

# WebSocket Routes
app.include_router(ai_stream_router, tags=["websocket"])


@app.get("/api/health")
async def health_check():
    settings = get_settings()
    return {
        "status": "healthy",
        "version": "0.1.0",
        "mongodb_connected": is_mongo_connected(),
        "mongodb_database": settings.mongodb_database if is_mongo_connected() else None,
    }

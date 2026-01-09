"""
MongoDB client setup for Hydra Notes.

Uses Motor (async MongoDB driver) with connection pooling.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import Optional

from app.config import get_settings

# Global client instance (initialized on startup)
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    """Initialize MongoDB connection. Call on app startup."""
    global _client, _database

    settings = get_settings()

    if not settings.mongodb_uri:
        raise ValueError("MONGODB_URI not configured")

    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        maxPoolSize=10,
        minPoolSize=1,
        serverSelectionTimeoutMS=5000,
    )
    _database = _client[settings.mongodb_database]

    # Verify connection
    await _client.admin.command("ping")
    print(f"Connected to MongoDB: {settings.mongodb_database}")


async def close_mongo_connection() -> None:
    """Close MongoDB connection. Call on app shutdown."""
    global _client, _database

    if _client:
        _client.close()
        _client = None
        _database = None
        print("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get the MongoDB database instance."""
    if _database is None:
        raise RuntimeError("MongoDB not connected. Call connect_to_mongo() first.")
    return _database


def get_blocks_collection() -> AsyncIOMotorCollection:
    """Get the blocks collection."""
    return get_database()["blocks"]


def get_tags_collection() -> AsyncIOMotorCollection:
    """Get the tags collection."""
    return get_database()["tags"]


def get_versions_collection() -> AsyncIOMotorCollection:
    """Get the versions collection."""
    return get_database()["versions"]


async def create_indexes() -> None:
    """Create all required indexes. Call after connection."""
    blocks = get_blocks_collection()
    tags = get_tags_collection()
    versions = get_versions_collection()

    # Blocks indexes
    await blocks.create_index([("user_id", 1), ("parent_id", 1), ("order", 1)])
    await blocks.create_index([("user_id", 1), ("depth", 1)])
    await blocks.create_index([("user_id", 1), ("updated_at", -1)])
    await blocks.create_index([("user_id", 1), ("portals_in", 1)])
    await blocks.create_index([("user_id", 1), ("backlinks", 1)])
    await blocks.create_index([("user_id", 1), ("tags", 1)])
    await blocks.create_index([("user_id", 1), ("deleted_at", 1)])

    # Tags indexes
    await tags.create_index([("user_id", 1), ("name", 1)], unique=True)
    await tags.create_index([("user_id", 1), ("path", 1)])

    # Versions indexes
    await versions.create_index([("block_id", 1), ("version", -1)])
    await versions.create_index([("user_id", 1), ("created_at", -1)])

    print("MongoDB indexes created")

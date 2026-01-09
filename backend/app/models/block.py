"""
Pydantic models for blocks in Hydra Notes.

These models define the API request/response schemas.
MongoDB documents are stored with ObjectId but exposed as strings in the API.
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class BlockContent(BaseModel):
    """Block content - MVP1 is text only, future: rich content."""
    text: str = ""
    content_type: Literal["text"] = "text"


class BlockProps(BaseModel):
    """Block type-specific properties."""
    marker_type: Optional[str] = None  # "%Template", "%Visualization"
    marker_color: Optional[str] = None


class BlockUIState(BaseModel):
    """UI state for the block."""
    is_collapsed: bool = False
    collapsed_separator: str = " + "  # " + " | ", " | " | "
    last_expand_timestamp: Optional[datetime] = None


class BlockReference(BaseModel):
    """A reference from this block to another."""
    target_id: str
    ref_type: Literal["inline_link", "backlink"] = "inline_link"
    position: Optional[dict] = None  # {start: int, end: int}


# --- API Request Models ---

class BlockCreate(BaseModel):
    """Request model for creating a new block."""
    parent_id: Optional[str] = None  # null for root blocks
    content: BlockContent = Field(default_factory=BlockContent)
    block_type: Literal["bullet", "marker", "heading"] = "bullet"
    block_props: Optional[BlockProps] = None
    ui_state: Optional[BlockUIState] = None
    order: Optional[int] = None  # Position among siblings, auto-assigned if not provided


class BlockUpdate(BaseModel):
    """Request model for updating a block."""
    content: Optional[BlockContent] = None
    block_type: Optional[Literal["bullet", "marker", "heading"]] = None
    block_props: Optional[BlockProps] = None
    ui_state: Optional[BlockUIState] = None


class BlockMove(BaseModel):
    """Request model for moving a block."""
    new_parent_id: Optional[str] = None  # null to make root
    new_order: int  # Position among siblings


# --- API Response Models ---

class BlockResponse(BaseModel):
    """Response model for a single block."""
    id: str
    user_id: str
    parent_id: Optional[str]
    children: list[str]
    order: int
    depth: int
    content: BlockContent
    block_type: str
    block_props: Optional[BlockProps]
    ui_state: BlockUIState
    portals_in: list[str]
    portal_of: Optional[str]
    references: list[BlockReference]
    backlinks: list[str]
    tags: list[str]
    version: int
    created_at: datetime
    updated_at: datetime


class BlockTreeResponse(BaseModel):
    """Response model for a block with its subtree."""
    block: BlockResponse
    descendants: list[BlockResponse]


class BlockListResponse(BaseModel):
    """Response model for a list of blocks."""
    blocks: list[BlockResponse]
    total: int


# --- Helper functions ---

def block_to_response(doc: dict) -> BlockResponse:
    """Convert a MongoDB document to a BlockResponse."""
    return BlockResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        parent_id=str(doc["parent_id"]) if doc.get("parent_id") else None,
        children=[str(c) for c in doc.get("children", [])],
        order=doc.get("order", 0),
        depth=doc.get("depth", 0),
        content=BlockContent(**doc.get("content", {})),
        block_type=doc.get("block_type", "bullet"),
        block_props=BlockProps(**doc["block_props"]) if doc.get("block_props") else None,
        ui_state=BlockUIState(**doc.get("ui_state", {})),
        portals_in=[str(p) for p in doc.get("portals_in", [])],
        portal_of=str(doc["portal_of"]) if doc.get("portal_of") else None,
        references=[BlockReference(**r) for r in doc.get("references", [])],
        backlinks=[str(b) for b in doc.get("backlinks", [])],
        tags=[str(t) for t in doc.get("tags", [])],
        version=doc.get("version", 1),
        created_at=doc.get("created_at", datetime.utcnow()),
        updated_at=doc.get("updated_at", datetime.utcnow()),
    )

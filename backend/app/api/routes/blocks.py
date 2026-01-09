"""
Block CRUD endpoints for Hydra Notes.

All endpoints are user-scoped via MongoDB auth middleware.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId

from app.db.mongo import get_blocks_collection
from app.middleware.mongo_auth import get_current_user_id, require_block_ownership, user_scoped_query
from app.models.block import (
    BlockCreate,
    BlockUpdate,
    BlockMove,
    BlockResponse,
    BlockTreeResponse,
    BlockListResponse,
    block_to_response,
)

router = APIRouter()


@router.get("", response_model=BlockListResponse)
async def list_blocks(
    parent_id: Optional[str] = Query(None, description="Filter by parent ID (empty string or omit for roots, 'all' for all blocks)"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
):
    """List blocks for the current user."""
    blocks = get_blocks_collection()

    query = user_scoped_query(user_id)

    # Filter by parent
    # None or "" -> root blocks only (parent_id is null)
    # "all" -> all blocks (no parent filter)
    # ObjectId string -> children of that block
    if parent_id is None or parent_id == "":
        query["parent_id"] = None
    elif parent_id != "all":
        try:
            query["parent_id"] = ObjectId(parent_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid parent_id format")

    cursor = blocks.find(query).sort("order", 1).skip(offset).limit(limit)
    docs = await cursor.to_list(length=limit)
    total = await blocks.count_documents(query)

    return BlockListResponse(
        blocks=[block_to_response(doc) for doc in docs],
        total=total,
    )


@router.get("/{block_id}", response_model=BlockResponse)
async def get_block(
    block_id: str = Depends(require_block_ownership),
    user_id: str = Depends(get_current_user_id),
):
    """Get a single block by ID."""
    blocks = get_blocks_collection()

    doc = await blocks.find_one({
        "_id": ObjectId(block_id),
        **user_scoped_query(user_id),
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Block not found")

    return block_to_response(doc)


@router.get("/{block_id}/tree", response_model=BlockTreeResponse)
async def get_block_tree(
    block_id: str = Depends(require_block_ownership),
    max_depth: int = Query(10, ge=1, le=20),
    user_id: str = Depends(get_current_user_id),
):
    """Get a block with its entire subtree using $graphLookup."""
    blocks = get_blocks_collection()

    pipeline = [
        {"$match": {"_id": ObjectId(block_id), "user_id": user_id}},
        {
            "$graphLookup": {
                "from": "blocks",
                "startWith": "$children",
                "connectFromField": "children",
                "connectToField": "_id",
                "as": "descendants",
                "maxDepth": max_depth,
                "restrictSearchWithMatch": {"deleted_at": None},
            }
        },
    ]

    result = await blocks.aggregate(pipeline).to_list(length=1)

    if not result:
        raise HTTPException(status_code=404, detail="Block not found")

    doc = result[0]
    descendants = doc.pop("descendants", [])

    return BlockTreeResponse(
        block=block_to_response(doc),
        descendants=[block_to_response(d) for d in descendants],
    )


@router.post("", response_model=BlockResponse, status_code=201)
async def create_block(
    data: BlockCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new block."""
    blocks = get_blocks_collection()
    now = datetime.utcnow()

    # Validate parent exists and belongs to user
    parent_oid = None
    depth = 0
    if data.parent_id:
        try:
            parent_oid = ObjectId(data.parent_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid parent_id format")

        parent = await blocks.find_one({
            "_id": parent_oid,
            **user_scoped_query(user_id),
        })
        if not parent:
            raise HTTPException(status_code=404, detail="Parent block not found")
        depth = parent.get("depth", 0) + 1

    # Calculate order if not provided
    order = data.order
    if order is None:
        # Get max order among siblings
        siblings_query = {**user_scoped_query(user_id), "parent_id": parent_oid}
        max_order_doc = await blocks.find_one(
            siblings_query,
            sort=[("order", -1)],
            projection={"order": 1},
        )
        order = (max_order_doc["order"] + 1) if max_order_doc else 0

    # Create the document
    doc = {
        "user_id": user_id,
        "parent_id": parent_oid,
        "children": [],
        "order": order,
        "depth": depth,
        "content": data.content.model_dump(),
        "block_type": data.block_type,
        "block_props": data.block_props.model_dump() if data.block_props else None,
        "ui_state": (data.ui_state or BlockCreate().ui_state or {}).model_dump() if data.ui_state else {
            "is_collapsed": False,
            "collapsed_separator": " + ",
            "last_expand_timestamp": None,
        },
        "portals_in": [],
        "portal_of": None,
        "references": [],
        "backlinks": [],
        "tags": [],
        "version": 1,
        "crdt_clock": {},
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }

    result = await blocks.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Update parent's children array
    if parent_oid:
        await blocks.update_one(
            {"_id": parent_oid},
            {"$push": {"children": result.inserted_id}, "$set": {"updated_at": now}},
        )

    return block_to_response(doc)


@router.patch("/{block_id}", response_model=BlockResponse)
async def update_block(
    data: BlockUpdate,
    block_id: str = Depends(require_block_ownership),
    user_id: str = Depends(get_current_user_id),
):
    """Update a block's content, type, props, or UI state."""
    blocks = get_blocks_collection()
    now = datetime.utcnow()

    update_data = {"updated_at": now}

    if data.content is not None:
        update_data["content"] = data.content.model_dump()
    if data.block_type is not None:
        update_data["block_type"] = data.block_type
    if data.block_props is not None:
        update_data["block_props"] = data.block_props.model_dump()
    if data.ui_state is not None:
        update_data["ui_state"] = data.ui_state.model_dump()

    result = await blocks.find_one_and_update(
        {"_id": ObjectId(block_id), **user_scoped_query(user_id)},
        {"$set": update_data, "$inc": {"version": 1}},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Block not found")

    return block_to_response(result)


@router.post("/{block_id}/move", response_model=BlockResponse)
async def move_block(
    data: BlockMove,
    block_id: str = Depends(require_block_ownership),
    user_id: str = Depends(get_current_user_id),
):
    """Move a block to a new parent and/or position."""
    blocks = get_blocks_collection()
    now = datetime.utcnow()
    block_oid = ObjectId(block_id)

    # Get current block
    current = await blocks.find_one({
        "_id": block_oid,
        **user_scoped_query(user_id),
    })
    if not current:
        raise HTTPException(status_code=404, detail="Block not found")

    old_parent_id = current.get("parent_id")

    # Validate new parent
    new_parent_oid = None
    new_depth = 0
    if data.new_parent_id:
        try:
            new_parent_oid = ObjectId(data.new_parent_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid new_parent_id format")

        # Prevent moving to self or descendant
        if new_parent_oid == block_oid:
            raise HTTPException(status_code=400, detail="Cannot move block to itself")

        new_parent = await blocks.find_one({
            "_id": new_parent_oid,
            **user_scoped_query(user_id),
        })
        if not new_parent:
            raise HTTPException(status_code=404, detail="New parent block not found")
        new_depth = new_parent.get("depth", 0) + 1

    # Remove from old parent's children
    if old_parent_id:
        await blocks.update_one(
            {"_id": old_parent_id},
            {"$pull": {"children": block_oid}, "$set": {"updated_at": now}},
        )

    # Add to new parent's children
    if new_parent_oid:
        await blocks.update_one(
            {"_id": new_parent_oid},
            {"$push": {"children": block_oid}, "$set": {"updated_at": now}},
        )

    # Update the block itself
    result = await blocks.find_one_and_update(
        {"_id": block_oid},
        {
            "$set": {
                "parent_id": new_parent_oid,
                "order": data.new_order,
                "depth": new_depth,
                "updated_at": now,
            },
            "$inc": {"version": 1},
        },
        return_document=True,
    )

    # TODO: Update depth of all descendants recursively

    return block_to_response(result)


@router.delete("/{block_id}", status_code=204)
async def delete_block(
    block_id: str = Depends(require_block_ownership),
    user_id: str = Depends(get_current_user_id),
):
    """Soft delete a block and all its descendants."""
    blocks = get_blocks_collection()
    now = datetime.utcnow()
    block_oid = ObjectId(block_id)

    # Get the block and its subtree
    pipeline = [
        {"$match": {"_id": block_oid, "user_id": user_id, "deleted_at": None}},
        {
            "$graphLookup": {
                "from": "blocks",
                "startWith": "$children",
                "connectFromField": "children",
                "connectToField": "_id",
                "as": "descendants",
                "restrictSearchWithMatch": {"deleted_at": None},
            }
        },
    ]

    result = await blocks.aggregate(pipeline).to_list(length=1)
    if not result:
        raise HTTPException(status_code=404, detail="Block not found")

    doc = result[0]
    descendant_ids = [d["_id"] for d in doc.get("descendants", [])]
    all_ids = [block_oid] + descendant_ids

    # Soft delete all blocks
    await blocks.update_many(
        {"_id": {"$in": all_ids}},
        {"$set": {"deleted_at": now, "updated_at": now}},
    )

    # Remove from parent's children
    parent_id = doc.get("parent_id")
    if parent_id:
        await blocks.update_one(
            {"_id": parent_id},
            {"$pull": {"children": block_oid}, "$set": {"updated_at": now}},
        )

    return None


@router.get("/{block_id}/children", response_model=BlockListResponse)
async def get_children(
    block_id: str = Depends(require_block_ownership),
    user_id: str = Depends(get_current_user_id),
):
    """Get direct children of a block."""
    blocks = get_blocks_collection()

    query = {
        **user_scoped_query(user_id),
        "parent_id": ObjectId(block_id),
    }

    cursor = blocks.find(query).sort("order", 1)
    docs = await cursor.to_list(length=500)
    total = await blocks.count_documents(query)

    return BlockListResponse(
        blocks=[block_to_response(doc) for doc in docs],
        total=total,
    )

"""
Unit tests for blocks API endpoints.

Tests use dependency overrides to mock MongoDB and auth.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport
from bson import ObjectId
from datetime import datetime

from app.main import app
from app.middleware.mongo_auth import get_current_user_id
from app.db.mongo import get_blocks_collection


# Test user ID
TEST_USER_ID = "test-user-123"
AUTH_HEADER = {"Authorization": f"Bearer {TEST_USER_ID}"}


# Mock collection for tests
mock_collection = AsyncMock()


def override_get_current_user_id():
    """Override auth dependency to return test user."""
    return TEST_USER_ID


def override_get_blocks_collection():
    """Override blocks collection with mock."""
    return mock_collection


@pytest.fixture(autouse=True)
def setup_overrides():
    """Set up dependency overrides for all tests."""
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    yield
    app.dependency_overrides.clear()
    mock_collection.reset_mock()


@pytest.fixture
async def client():
    """Create test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestListBlocks:
    """Tests for GET /api/blocks."""

    @pytest.mark.asyncio
    async def test_list_root_blocks(self, client):
        """Should list only root blocks when parent_id not specified."""
        import app.api.routes.blocks as blocks_module

        mock_doc = {
            "_id": ObjectId(),
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "children": [],
            "order": 0,
            "depth": 0,
            "content": {"text": "Root block", "content_type": "text"},
            "block_type": "bullet",
            "block_props": None,
            "ui_state": {"is_collapsed": False, "collapsed_separator": " + "},
            "portals_in": [],
            "portal_of": None,
            "references": [],
            "backlinks": [],
            "tags": [],
            "version": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        # Create a fresh mock for this test
        # Motor's find() returns a cursor synchronously, so use MagicMock for the chain
        test_collection = MagicMock()
        cursor = MagicMock()
        cursor.to_list = AsyncMock(return_value=[mock_doc])
        test_collection.find.return_value.sort.return_value.skip.return_value.limit.return_value = cursor
        test_collection.count_documents = AsyncMock(return_value=1)

        original = blocks_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: test_collection

        try:
            response = await client.get("/api/blocks", headers=AUTH_HEADER)

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert len(data["blocks"]) == 1
            assert data["blocks"][0]["content"]["text"] == "Root block"
        finally:
            blocks_module.get_blocks_collection = original

    @pytest.mark.asyncio
    async def test_list_blocks_requires_auth(self, client):
        """Should return 401 without authorization header."""
        # Remove auth override for this test
        app.dependency_overrides.clear()

        response = await client.get("/api/blocks")
        assert response.status_code == 401

        # Restore override
        app.dependency_overrides[get_current_user_id] = override_get_current_user_id


class TestCreateBlock:
    """Tests for POST /api/blocks."""

    @pytest.mark.asyncio
    async def test_create_root_block(self, client):
        """Should create a root block successfully."""
        import app.api.routes.blocks as blocks_module

        new_id = ObjectId()

        # Setup mocks
        mock_collection.find_one = AsyncMock(return_value=None)
        mock_collection.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=new_id)
        )

        original = blocks_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.post(
                "/api/blocks",
                json={"content": {"text": "New root block", "content_type": "text"}},
                headers=AUTH_HEADER,
            )

            assert response.status_code == 201
            data = response.json()
            assert data["content"]["text"] == "New root block"
            assert data["parent_id"] is None
            assert data["depth"] == 0
        finally:
            blocks_module.get_blocks_collection = original

    @pytest.mark.asyncio
    async def test_create_child_block(self, client):
        """Should create a child block with correct depth."""
        import app.api.routes.blocks as blocks_module

        parent_id = ObjectId()
        child_id = ObjectId()

        parent_doc = {
            "_id": parent_id,
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "depth": 0,
            "deleted_at": None,
        }

        # Setup mocks - find_one is called twice: once for parent validation, once for max order
        mock_collection.find_one = AsyncMock(side_effect=[
            parent_doc,  # First call: validate parent exists
            None,  # Second call: find max order (no siblings)
        ])
        mock_collection.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=child_id)
        )
        mock_collection.update_one = AsyncMock()

        original = blocks_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.post(
                "/api/blocks",
                json={
                    "parent_id": str(parent_id),
                    "content": {"text": "Child block", "content_type": "text"},
                },
                headers=AUTH_HEADER,
            )

            assert response.status_code == 201
            data = response.json()
            assert data["content"]["text"] == "Child block"
            assert data["depth"] == 1
        finally:
            blocks_module.get_blocks_collection = original

    @pytest.mark.asyncio
    async def test_create_block_invalid_parent(self, client):
        """Should return 404 for non-existent parent."""
        import app.api.routes.blocks as blocks_module

        mock_collection.find_one = AsyncMock(return_value=None)

        original = blocks_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.post(
                "/api/blocks",
                json={
                    "parent_id": str(ObjectId()),
                    "content": {"text": "Orphan block", "content_type": "text"},
                },
                headers=AUTH_HEADER,
            )

            assert response.status_code == 404
        finally:
            blocks_module.get_blocks_collection = original


class TestGetBlock:
    """Tests for GET /api/blocks/{block_id}."""

    @pytest.mark.asyncio
    async def test_get_block_success(self, client):
        """Should return block by ID."""
        import app.api.routes.blocks as blocks_module
        import app.middleware.mongo_auth as auth_module

        block_id = ObjectId()
        mock_doc = {
            "_id": block_id,
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "children": [],
            "order": 0,
            "depth": 0,
            "content": {"text": "Test block", "content_type": "text"},
            "block_type": "bullet",
            "block_props": None,
            "ui_state": {"is_collapsed": False, "collapsed_separator": " + "},
            "portals_in": [],
            "portal_of": None,
            "references": [],
            "backlinks": [],
            "tags": [],
            "version": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "deleted_at": None,
        }

        mock_collection.find_one = AsyncMock(return_value=mock_doc)

        original_blocks = blocks_module.get_blocks_collection
        original_auth = auth_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection
        auth_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.get(f"/api/blocks/{block_id}", headers=AUTH_HEADER)

            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(block_id)
            assert data["content"]["text"] == "Test block"
        finally:
            blocks_module.get_blocks_collection = original_blocks
            auth_module.get_blocks_collection = original_auth

    @pytest.mark.asyncio
    async def test_get_block_not_found(self, client):
        """Should return 404 for non-existent block."""
        import app.api.routes.blocks as blocks_module
        import app.middleware.mongo_auth as auth_module

        mock_collection.find_one = AsyncMock(return_value=None)

        original_blocks = blocks_module.get_blocks_collection
        original_auth = auth_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection
        auth_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.get(f"/api/blocks/{ObjectId()}", headers=AUTH_HEADER)

            assert response.status_code == 404
        finally:
            blocks_module.get_blocks_collection = original_blocks
            auth_module.get_blocks_collection = original_auth


class TestUpdateBlock:
    """Tests for PATCH /api/blocks/{block_id}."""

    @pytest.mark.asyncio
    async def test_update_block_content(self, client):
        """Should update block content."""
        import app.api.routes.blocks as blocks_module
        import app.middleware.mongo_auth as auth_module

        block_id = ObjectId()
        existing_doc = {
            "_id": block_id,
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "children": [],
            "deleted_at": None,
        }
        updated_doc = {
            "_id": block_id,
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "children": [],
            "order": 0,
            "depth": 0,
            "content": {"text": "Updated content", "content_type": "text"},
            "block_type": "bullet",
            "block_props": None,
            "ui_state": {"is_collapsed": False, "collapsed_separator": " + "},
            "portals_in": [],
            "portal_of": None,
            "references": [],
            "backlinks": [],
            "tags": [],
            "version": 2,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "deleted_at": None,
        }

        # Mock ownership check and update
        mock_collection.find_one = AsyncMock(return_value=existing_doc)
        mock_collection.find_one_and_update = AsyncMock(return_value=updated_doc)

        original_blocks = blocks_module.get_blocks_collection
        original_auth = auth_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection
        auth_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.patch(
                f"/api/blocks/{block_id}",
                json={"content": {"text": "Updated content", "content_type": "text"}},
                headers=AUTH_HEADER,
            )

            assert response.status_code == 200
            data = response.json()
            assert data["content"]["text"] == "Updated content"
        finally:
            blocks_module.get_blocks_collection = original_blocks
            auth_module.get_blocks_collection = original_auth


class TestDeleteBlock:
    """Tests for DELETE /api/blocks/{block_id}."""

    @pytest.mark.asyncio
    async def test_delete_block_soft_delete(self, client):
        """Should soft delete block and descendants."""
        import app.api.routes.blocks as blocks_module
        import app.middleware.mongo_auth as auth_module

        block_id = ObjectId()
        child_id = ObjectId()

        existing_doc = {
            "_id": block_id,
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "children": [child_id],
            "deleted_at": None,
        }

        tree_result = {
            "_id": block_id,
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "children": [child_id],
            "deleted_at": None,
            "descendants": [
                {"_id": child_id, "user_id": TEST_USER_ID, "deleted_at": None}
            ],
        }

        # Mock ownership check
        mock_collection.find_one = AsyncMock(return_value=existing_doc)

        # Mock aggregation for tree query
        cursor = AsyncMock()
        cursor.to_list = AsyncMock(return_value=[tree_result])
        mock_collection.aggregate = MagicMock(return_value=cursor)

        mock_collection.update_many = AsyncMock()
        mock_collection.update_one = AsyncMock()

        original_blocks = blocks_module.get_blocks_collection
        original_auth = auth_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection
        auth_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.delete(f"/api/blocks/{block_id}", headers=AUTH_HEADER)

            assert response.status_code == 204

            # Verify soft delete was called
            mock_collection.update_many.assert_called_once()
        finally:
            blocks_module.get_blocks_collection = original_blocks
            auth_module.get_blocks_collection = original_auth


class TestGetBlockTree:
    """Tests for GET /api/blocks/{block_id}/tree."""

    @pytest.mark.asyncio
    async def test_get_block_tree(self, client):
        """Should return block with all descendants."""
        import app.api.routes.blocks as blocks_module
        import app.middleware.mongo_auth as auth_module

        root_id = ObjectId()
        child_id = ObjectId()

        existing_doc = {
            "_id": root_id,
            "user_id": TEST_USER_ID,
            "deleted_at": None,
        }

        tree_result = {
            "_id": root_id,
            "user_id": TEST_USER_ID,
            "parent_id": None,
            "children": [child_id],
            "order": 0,
            "depth": 0,
            "content": {"text": "Root", "content_type": "text"},
            "block_type": "bullet",
            "block_props": None,
            "ui_state": {"is_collapsed": False, "collapsed_separator": " + "},
            "portals_in": [],
            "portal_of": None,
            "references": [],
            "backlinks": [],
            "tags": [],
            "version": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "deleted_at": None,
            "descendants": [
                {
                    "_id": child_id,
                    "user_id": TEST_USER_ID,
                    "parent_id": root_id,
                    "children": [],
                    "order": 0,
                    "depth": 1,
                    "content": {"text": "Child", "content_type": "text"},
                    "block_type": "bullet",
                    "block_props": None,
                    "ui_state": {"is_collapsed": False, "collapsed_separator": " + "},
                    "portals_in": [],
                    "portal_of": None,
                    "references": [],
                    "backlinks": [],
                    "tags": [],
                    "version": 1,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            ],
        }

        # Mock ownership check
        mock_collection.find_one = AsyncMock(return_value=existing_doc)

        # Mock aggregation
        cursor = AsyncMock()
        cursor.to_list = AsyncMock(return_value=[tree_result])
        mock_collection.aggregate = MagicMock(return_value=cursor)

        original_blocks = blocks_module.get_blocks_collection
        original_auth = auth_module.get_blocks_collection
        blocks_module.get_blocks_collection = lambda: mock_collection
        auth_module.get_blocks_collection = lambda: mock_collection

        try:
            response = await client.get(f"/api/blocks/{root_id}/tree", headers=AUTH_HEADER)

            assert response.status_code == 200
            data = response.json()
            assert data["block"]["id"] == str(root_id)
            assert len(data["descendants"]) == 1
            assert data["descendants"][0]["content"]["text"] == "Child"
        finally:
            blocks_module.get_blocks_collection = original_blocks
            auth_module.get_blocks_collection = original_auth

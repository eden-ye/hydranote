"""WebSocket endpoint for streaming AI responses."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import json

from app.services.claude import get_claude_service, ClaudeServiceError

router = APIRouter()


async def authenticate_websocket(websocket: WebSocket, token: Optional[str]) -> Optional[str]:
    """
    Authenticate WebSocket connection using token from query parameter.

    Args:
        websocket: The WebSocket connection
        token: Token from query parameter

    Returns:
        User ID if authenticated, None otherwise
    """
    if not token or token.strip() == "":
        await websocket.close(code=4001, reason="Authentication required")
        return None

    # TODO: In production, validate JWT token here
    # For now, we trust the token as the user ID (development only)
    return token


@router.websocket("/ws/ai/stream")
async def ai_stream(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for streaming AI responses.

    Query Parameters:
        token: Authentication token (required)

    Message Types (client -> server):
        - {"action": "generate", "prompt": "...", "system": "..."} - Generate AI response
        - {"action": "ping"} - Heartbeat ping

    Message Types (server -> client):
        - {"type": "chunk", "text": "..."} - Streamed text chunk
        - {"type": "done", "user_id": "..."} - Generation complete
        - {"type": "error", "message": "..."} - Error occurred
        - {"type": "pong"} - Heartbeat response
    """
    # Authenticate
    user_id = await authenticate_websocket(websocket, token)
    if not user_id:
        return

    # Accept connection
    await websocket.accept()

    try:
        while True:
            # Wait for message from client
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "ping":
                await websocket.send_json({"type": "pong"})

            elif action == "generate":
                prompt = data.get("prompt")
                if not prompt:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Prompt is required for generate action",
                    })
                    continue

                system = data.get("system")
                max_tokens = data.get("max_tokens")

                try:
                    claude_service = get_claude_service()
                    async for chunk in claude_service.generate_stream(
                        prompt=prompt,
                        system=system,
                        max_tokens=max_tokens,
                    ):
                        await websocket.send_json({
                            "type": "chunk",
                            "text": chunk,
                        })

                    await websocket.send_json({
                        "type": "done",
                        "user_id": user_id,
                    })

                except ClaudeServiceError as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e),
                    })

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown action: {action}",
                })

    except WebSocketDisconnect:
        # Client disconnected gracefully
        pass
    except Exception as e:
        # Unexpected error - try to send error message before closing
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Internal server error: {str(e)}",
            })
        except Exception:
            pass

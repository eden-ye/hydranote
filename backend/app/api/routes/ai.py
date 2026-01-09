from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class GenerateRequest(BaseModel):
    input_text: str
    max_levels: int = 5


class BulletNode(BaseModel):
    text: str
    children: List["BulletNode"] = []


class GenerateResponse(BaseModel):
    bullets: List[BulletNode]
    tokens_used: int


@router.post("/generate", response_model=GenerateResponse)
async def generate_structure(request: GenerateRequest):
    """Generate hierarchical note structure from input text - placeholder"""
    # TODO: Implement Claude API integration
    raise HTTPException(status_code=501, detail="AI generation not yet implemented")


@router.post("/expand")
async def expand_bullet(bullet_text: str, siblings: List[str] = [], parent_context: Optional[str] = None):
    """Expand a single bullet with AI-generated sub-bullets - placeholder"""
    # TODO: Implement Claude API integration
    raise HTTPException(status_code=501, detail="AI expansion not yet implemented")

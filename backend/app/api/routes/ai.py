import json
import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.claude import get_claude_service, ClaudeServiceError
from app.services.prompts import (
    get_prompt_builder,
    PromptType,
    BlockContext,
)

router = APIRouter()


class GenerateRequest(BaseModel):
    input_text: str
    max_levels: int = 3


class BulletNode(BaseModel):
    text: str
    children: List["BulletNode"] = []


class GenerateResponse(BaseModel):
    bullets: List[BulletNode]
    tokens_used: int


class ExpandRequest(BaseModel):
    bullet_text: str
    siblings: List[str] = []
    parent_context: Optional[str] = None


class ExpandResponse(BaseModel):
    children: List[str]
    tokens_used: int


def parse_bullet_json(text: str) -> List[dict]:
    """Parse JSON array from Claude response, handling markdown code blocks."""
    # Try to extract JSON from markdown code blocks
    code_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if code_block_match:
        text = code_block_match.group(1).strip()

    # Try to find JSON array in the text
    array_match = re.search(r'\[[\s\S]*\]', text)
    if array_match:
        text = array_match.group(0)

    return json.loads(text)


def build_hierarchy_from_flat(items: List[str], max_levels: int) -> List[BulletNode]:
    """Build a flat list of bullets (no nesting for now)."""
    return [BulletNode(text=item, children=[]) for item in items]


@router.post("/generate", response_model=GenerateResponse)
async def generate_structure(request: GenerateRequest):
    """Generate hierarchical note structure from input text."""
    try:
        claude = get_claude_service()
        prompt_builder = get_prompt_builder()

        # Build context for generation
        context = BlockContext(text=request.input_text)

        # Get system prompt and user prompt
        system_prompt = prompt_builder.get_system_prompt(PromptType.GENERATE_CHILDREN)
        user_prompt = f"""Generate a hierarchical breakdown of the following topic into bullet points.

Topic: "{request.input_text}"

Requirements:
- Generate 3-7 main bullet points that cover the key aspects of this topic
- Each bullet should be concise (under 20 words)
- Focus on the most important and relevant aspects
- Make bullets specific and informative

Output Format:
Respond with a JSON array of strings, where each string is a bullet point.

Example:
Input: "How computers work"
Output: ["CPU processes instructions using fetch-decode-execute cycle", "RAM provides fast temporary storage for active programs", "Storage devices (SSD/HDD) hold persistent data", "Operating system manages hardware and software resources", "Input/output devices enable human-computer interaction"]

Respond with ONLY the JSON array, no additional text."""

        # Call Claude API
        result = await claude.generate(
            prompt=user_prompt,
            system=system_prompt,
            max_tokens=1024,
        )

        # Parse the response
        try:
            bullet_texts = parse_bullet_json(result["text"])
            bullets = build_hierarchy_from_flat(bullet_texts, request.max_levels)
        except (json.JSONDecodeError, KeyError) as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse AI response: {str(e)}"
            )

        return GenerateResponse(
            bullets=bullets,
            tokens_used=result["tokens_used"]
        )

    except ClaudeServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/expand", response_model=ExpandResponse)
async def expand_bullet(request: ExpandRequest):
    """Expand a single bullet with AI-generated sub-bullets."""
    try:
        claude = get_claude_service()
        prompt_builder = get_prompt_builder()

        # Build context for expansion
        context = BlockContext(
            text=request.bullet_text,
            parent_text=request.parent_context,
            sibling_texts=request.siblings,
        )

        # Get system prompt and build user prompt
        system_prompt = prompt_builder.get_system_prompt(PromptType.GENERATE_CHILDREN)
        user_prompt = prompt_builder.build(PromptType.GENERATE_CHILDREN, context)

        # Call Claude API
        result = await claude.generate(
            prompt=user_prompt,
            system=system_prompt,
            max_tokens=1024,
        )

        # Parse the response
        try:
            children = parse_bullet_json(result["text"])
            # Ensure we have a list of strings
            if not all(isinstance(item, str) for item in children):
                raise ValueError("Expected array of strings")
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse AI response: {str(e)}"
            )

        return ExpandResponse(
            children=children,
            tokens_used=result["tokens_used"]
        )

    except ClaudeServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))

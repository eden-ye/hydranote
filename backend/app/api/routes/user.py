from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class UserLimitsResponse(BaseModel):
    ai_generations_used: int
    ai_generations_limit: int
    remaining: int


@router.get("/limits", response_model=UserLimitsResponse)
async def get_user_limits():
    """Get user's AI generation limits - placeholder"""
    # TODO: Implement with Supabase user data
    return UserLimitsResponse(
        ai_generations_used=0,
        ai_generations_limit=50,
        remaining=50,
    )

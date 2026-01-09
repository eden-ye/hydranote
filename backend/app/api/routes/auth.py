from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None = None


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get current authenticated user - placeholder for Supabase auth"""
    # TODO: Implement Supabase auth verification
    raise HTTPException(status_code=401, detail="Not authenticated")


@router.post("/logout")
async def logout():
    """Logout user - placeholder"""
    return {"message": "Logged out successfully"}

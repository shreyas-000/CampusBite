from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from core.database import supabase
from core.dependencies import require_role
from schemas.user import User, UserResponse

router = APIRouter()

class UpdateUserStatusRequest(BaseModel):
    is_active: bool

@router.get("", response_model=list[UserResponse])
async def list_users(_: User = Depends(require_role("admin"))):
    response = supabase.table("users").select("*").execute()
    return response.data

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, _: User = Depends(require_role("admin"))):
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

@router.patch("/{user_id}/status", response_model=UserResponse)
async def update_user_status(user_id: str, body: UpdateUserStatusRequest, _: User = Depends(require_role("admin"))):
    response = supabase.table("users").update({"is_active": body.is_active}).eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, _: User = Depends(require_role("admin"))):
    supabase.table("users").delete().eq("id", user_id).execute()

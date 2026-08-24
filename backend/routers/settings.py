from fastapi import APIRouter, Depends, HTTPException
from core.database import supabase
from core.dependencies import require_role, get_current_user
from schemas.user import User
from schemas.setting import SettingsResponse, UpdateSettingsRequest

router = APIRouter()

@router.get("", response_model=SettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user)):
    response = supabase.table("canteen_settings").select("*").limit(1).execute()
    if not response.data:
        # If no settings exist, create a default row
        insert_res = supabase.table("canteen_settings").insert({
            "is_accepting_orders": True,
            "razorpay_enabled": False
        }).execute()
        return insert_res.data[0]
        
    return response.data[0]

@router.patch("", response_model=SettingsResponse)
async def update_settings(body: UpdateSettingsRequest, _: User = Depends(require_role("admin"))):
    # Fetch current settings to get ID
    current = supabase.table("canteen_settings").select("id").limit(1).execute()
    if not current.data:
        raise HTTPException(status_code=500, detail="Settings not initialized")
        
    setting_id = current.data[0]["id"]
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    response = supabase.table("canteen_settings").update(update_data).eq("id", setting_id).execute()
    return response.data[0]

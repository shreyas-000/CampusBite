from fastapi import APIRouter, Depends, HTTPException
from core.database import supabase
from core.dependencies import get_current_user
from schemas.user import User
from schemas.notification import NotificationResponse

router = APIRouter()

@router.get("", response_model=list[NotificationResponse])
async def list_notifications(current_user: User = Depends(get_current_user)):
    response = supabase.table("notifications").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
    return response.data

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(notification_id: str, current_user: User = Depends(get_current_user)):
    # Verify ownership
    response = supabase.table("notifications").select("*").eq("id", notification_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if str(response.data[0].get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    update_res = supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
    return update_res.data[0]

@router.patch("/read-all", status_code=200)
async def mark_all_read(current_user: User = Depends(get_current_user)):
    supabase.table("notifications").update({"is_read": True}).eq("user_id", current_user.id).eq("is_read", False).execute()
    return {"message": "All notifications marked as read"}

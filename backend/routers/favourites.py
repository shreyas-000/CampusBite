from fastapi import APIRouter, Depends, HTTPException
from core.database import supabase
from core.dependencies import get_current_user
from schemas.user import User
from schemas.favourite import FavouriteResponse

router = APIRouter()

@router.get("", response_model=list[FavouriteResponse])
async def list_favourites(current_user: User = Depends(get_current_user)):
    response = supabase.table("favourites").select("*, menu_items(*)").eq("user_id", current_user.id).execute()
    return response.data

@router.post("/{item_id}", status_code=201)
async def add_favourite(item_id: str, current_user: User = Depends(get_current_user)):
    # Check if item exists
    item_response = supabase.table("menu_items").select("id").eq("id", item_id).execute()
    if not item_response.data:
        raise HTTPException(status_code=404, detail="Menu item not found")
        
    # Check if already favourited
    fav_response = supabase.table("favourites").select("id").eq("user_id", current_user.id).eq("menu_item_id", item_id).execute()
    if fav_response.data:
        return {"message": "Already in favourites"}
        
    supabase.table("favourites").insert({
        "user_id": current_user.id,
        "menu_item_id": item_id
    }).execute()
    
    return {"message": "Added to favourites"}

@router.delete("/{item_id}", status_code=204)
async def remove_favourite(item_id: str, current_user: User = Depends(get_current_user)):
    supabase.table("favourites").delete().eq("user_id", current_user.id).eq("menu_item_id", item_id).execute()

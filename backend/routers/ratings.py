from fastapi import APIRouter, Depends, HTTPException
from core.database import supabase
from core.dependencies import get_current_user
from schemas.user import User
from schemas.rating import CreateRatingRequest, RatingResponse

router = APIRouter()

@router.post("", response_model=RatingResponse, status_code=201)
async def create_rating(body: CreateRatingRequest, current_user: User = Depends(get_current_user)):
    # 1. Verify order belongs to user and is picked up
    order_response = supabase.table("orders").select("*, order_items(*)").eq("id", body.order_id).execute()
    if not order_response.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = order_response.data[0]
    if str(order.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    if order.get("status") != "picked_up":
        raise HTTPException(status_code=400, detail="Can only rate picked up orders")
        
    # 2. Verify menu_item is in the order
    item_in_order = any(str(item["menu_item_id"]) == str(body.menu_item_id) for item in order.get("order_items", []))
    if not item_in_order:
        raise HTTPException(status_code=400, detail="Item not found in this order")
        
    # 3. Insert rating
    rating_data = {
        "order_id": body.order_id,
        "menu_item_id": body.menu_item_id,
        "user_id": current_user.id,
        "rating": body.rating,
        "review": body.review
    }
    
    rating_response = supabase.table("ratings").insert(rating_data).execute()
    if not rating_response.data:
        raise HTTPException(status_code=500, detail="Failed to create rating")
        
    new_rating = rating_response.data[0]
    
    # 4. Recompute average rating for the menu item
    # Since Supabase python client doesn't have aggregate functions easily accessible without PostgREST JS's syntax, 
    # we'll fetch all ratings for this item and recompute. For large scales, this should be an RPC function.
    all_ratings = supabase.table("ratings").select("rating").eq("menu_item_id", body.menu_item_id).execute()
    ratings_list = [r["rating"] for r in all_ratings.data]
    
    count = len(ratings_list)
    avg = sum(ratings_list) / count if count > 0 else 0
    
    supabase.table("menu_items").update({
        "rating_avg": round(avg, 1),
        "rating_count": count
    }).eq("id", body.menu_item_id).execute()
    
    return new_rating

@router.get("/item/{item_id}", response_model=list[RatingResponse])
async def get_item_ratings(item_id: str):
    response = supabase.table("ratings").select("*").eq("menu_item_id", item_id).order("created_at", desc=True).execute()
    return response.data

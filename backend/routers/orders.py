import secrets
from fastapi import APIRouter, Depends, HTTPException
from core.database import supabase
from core.dependencies import get_current_user, require_role
from schemas.user import User
from schemas.order import OrderResponse, UpdateStatusRequest, SchedulePickupRequest

router = APIRouter()

@router.get("", response_model=list[OrderResponse])
async def list_orders(current_user: User = Depends(get_current_user)):
    query = supabase.table("orders").select("*, order_items(*)").order("created_at", desc=True)
    
    if current_user.role == "student":
        query = query.eq("user_id", current_user.id)
        
    response = query.execute()
    return response.data

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    response = supabase.table("orders").select("*, order_items(*)").eq("id", order_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = response.data[0]
    
    if current_user.role == "student" and str(order.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    return order

@router.post("", response_model=OrderResponse, status_code=201)
async def place_order(current_user: User = Depends(get_current_user)):
    # 1. Fetch cart and cart items
    cart_response = supabase.table("carts").select("*, cart_items(*, menu_items(*))").eq("user_id", current_user.id).execute()
    
    if not cart_response.data:
        raise HTTPException(status_code=400, detail="Cart is empty")
        
    cart = cart_response.data[0]
    cart_items = cart.get("cart_items", [])
    
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 2. Validate availability and calculate total
    total = 0
    order_items_to_insert = []
    
    for ci in cart_items:
        menu_item = ci.get("menu_items")
        if not menu_item or not menu_item.get("is_available"):
            item_name = menu_item.get("name") if menu_item else "Item"
            raise HTTPException(status_code=400, detail=f"'{item_name}' is no longer available")
            
        subtotal = menu_item["price"] * ci["quantity"]
        total += subtotal
        
        order_items_to_insert.append({
            "menu_item_id": menu_item["id"],
            "name": menu_item["name"],
            "quantity": ci["quantity"],
            "unit_price": menu_item["price"],
            "special_instructions": ci.get("special_instructions"),
        })

    # 3. Generate pickup token
    token = secrets.token_hex(3).upper()

    # 4. Insert orders record
    order_data = {
        "user_id": current_user.id,
        "pickup_token": token,
        "total": total,
    }
    order_response = supabase.table("orders").insert(order_data).execute()
    
    if not order_response.data:
        raise HTTPException(status_code=500, detail="Failed to create order")
        
    order_id = order_response.data[0]["id"]
    
    # Add order_id to all items
    for item in order_items_to_insert:
        item["order_id"] = order_id
        
    # 5. Insert order_items records
    supabase.table("order_items").insert(order_items_to_insert).execute()
    
    # 6. Delete user's cart_items
    supabase.table("cart_items").delete().eq("cart_id", cart["id"]).execute()
    
    # 7. Return complete order
    return await get_order(order_id, current_user)

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_status(order_id: str, body: UpdateStatusRequest, _: User = Depends(require_role("staff", "admin"))):
    response = supabase.table("orders").update({"status": body.status}).eq("id", order_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Refetch to get items
    refetch = supabase.table("orders").select("*, order_items(*)").eq("id", order_id).execute()
    return refetch.data[0]

@router.patch("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: str, current_user: User = Depends(get_current_user)):
    # Fetch current order to check status and ownership
    order_response = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not order_response.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = order_response.data[0]
    
    if str(order.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    if order.get("status") not in ("placed", "confirmed"):
        raise HTTPException(status_code=400, detail="Cannot cancel order in current status")
        
    # Update to cancelled
    update_response = supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id).execute()
    
    # Refetch to get items
    refetch = supabase.table("orders").select("*, order_items(*)").eq("id", order_id).execute()
    return refetch.data[0]

@router.patch("/{order_id}/schedule", response_model=OrderResponse)
async def schedule_pickup(order_id: str, body: SchedulePickupRequest, current_user: User = Depends(get_current_user)):
    # Ensure order exists and belongs to user
    order_response = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not order_response.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if str(order_response.data[0].get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Schedule
    supabase.table("orders").update({
        "scheduled_pickup_at": body.pickup_at.isoformat()
    }).eq("id", order_id).execute()
    
    # Refetch to get items
    refetch = supabase.table("orders").select("*, order_items(*)").eq("id", order_id).execute()
    return refetch.data[0]

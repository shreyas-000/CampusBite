from fastapi import APIRouter, Depends, HTTPException
from core.database import supabase
from core.dependencies import get_current_user
from schemas.user import User
from schemas.cart import AddItemRequest, UpdateItemRequest, CartResponse

router = APIRouter()

async def get_or_create_cart(user: User) -> dict:
    # Attempt to fetch cart with related items
    response = supabase.table("carts").select("*, cart_items(*, menu_items(*))").eq("user_id", user.id).execute()
    
    if response.data:
        return response.data[0]
        
    # If no cart, create one
    insert_response = supabase.table("carts").insert({"user_id": user.id}).execute()
    if not insert_response.data:
        raise HTTPException(status_code=500, detail="Failed to create cart")
        
    # Refetch to get the proper structure (with empty cart_items array)
    new_cart_response = supabase.table("carts").select("*, cart_items(*, menu_items(*))").eq("id", insert_response.data[0]["id"]).execute()
    return new_cart_response.data[0]

@router.get("", response_model=CartResponse)
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await get_or_create_cart(current_user)
    return cart

@router.post("/items", response_model=CartResponse, status_code=201)
async def add_item(body: AddItemRequest, current_user: User = Depends(get_current_user)):
    # Check if menu item exists and is available
    item_response = supabase.table("menu_items").select("*").eq("id", body.menu_item_id).execute()
    if not item_response.data or not item_response.data[0].get("is_available"):
        raise HTTPException(status_code=404, detail="Item not available")
        
    cart = await get_or_create_cart(current_user)
    cart_id = cart["id"]
    
    # Check if item already in cart
    existing_item = next((i for i in cart.get("cart_items", []) if i["menu_item_id"] == body.menu_item_id), None)
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + body.quantity
        update_data = {"quantity": new_quantity}
        if body.special_instructions:
            update_data["special_instructions"] = body.special_instructions
            
        supabase.table("cart_items").update(update_data).eq("id", existing_item["id"]).execute()
    else:
        # Insert new cart item
        insert_data = {
            "cart_id": cart_id,
            "menu_item_id": body.menu_item_id,
            "quantity": body.quantity,
            "special_instructions": body.special_instructions
        }
        supabase.table("cart_items").insert(insert_data).execute()
        
    # Return updated cart
    return await get_or_create_cart(current_user)

@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_item(item_id: str, body: UpdateItemRequest, current_user: User = Depends(get_current_user)):
    # Verify cart item belongs to user's cart
    cart = await get_or_create_cart(current_user)
    cart_item = next((i for i in cart.get("cart_items", []) if i["id"] == item_id), None)
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
        
    # Update quantity
    supabase.table("cart_items").update({"quantity": body.quantity}).eq("id", item_id).execute()
    
    return await get_or_create_cart(current_user)

@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_item(item_id: str, current_user: User = Depends(get_current_user)):
    # Verify cart item belongs to user's cart
    cart = await get_or_create_cart(current_user)
    cart_item = next((i for i in cart.get("cart_items", []) if i["id"] == item_id), None)
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
        
    # Delete item
    supabase.table("cart_items").delete().eq("id", item_id).execute()
    
    return await get_or_create_cart(current_user)

@router.delete("", status_code=204)
async def clear_cart(current_user: User = Depends(get_current_user)):
    cart = await get_or_create_cart(current_user)
    cart_id = cart["id"]
    
    # Delete all items for this cart
    supabase.table("cart_items").delete().eq("cart_id", cart_id).execute()

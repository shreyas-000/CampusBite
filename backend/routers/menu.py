from fastapi import APIRouter, Depends, HTTPException, Query
from core.database import supabase
from core.dependencies import require_role
from schemas.user import User
from schemas.menu import (
    CategoryCreate, CategoryResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse
)

router = APIRouter()

# --- Categories ---

@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories():
    response = supabase.table("categories").select("*").order("sort_order").execute()
    return response.data

@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(body: CategoryCreate, _: User = Depends(require_role("admin"))):
    response = supabase.table("categories").insert(body.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create category")
    return response.data[0]

@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, body: CategoryCreate, _: User = Depends(require_role("admin"))):
    response = supabase.table("categories").update(body.model_dump(exclude_unset=True)).eq("id", category_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return response.data[0]

@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: str, _: User = Depends(require_role("admin"))):
    response = supabase.table("categories").delete().eq("id", category_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Category not found")

# --- Menu Items ---

@router.get("/items", response_model=list[MenuItemResponse])
async def list_items(category_id: str | None = Query(None), search: str | None = Query(None)):
    query = supabase.table("menu_items").select("*")
    if category_id:
        query = query.eq("category_id", category_id)
    if search:
        query = query.ilike("name", f"%{search}%")
    
    response = query.order("name").execute()
    return response.data

@router.get("/items/{item_id}", response_model=MenuItemResponse)
async def get_item(item_id: str):
    response = supabase.table("menu_items").select("*").eq("id", item_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return response.data[0]

@router.post("/items", response_model=MenuItemResponse, status_code=201)
async def create_item(body: MenuItemCreate, _: User = Depends(require_role("admin"))):
    response = supabase.table("menu_items").insert(body.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create item")
    return response.data[0]

@router.patch("/items/{item_id}", response_model=MenuItemResponse)
async def update_item(item_id: str, body: MenuItemUpdate, _: User = Depends(require_role("admin"))):
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        # If nothing to update, just return the item
        return await get_item(item_id)
        
    response = supabase.table("menu_items").update(updates).eq("id", item_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return response.data[0]

@router.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: str, _: User = Depends(require_role("admin"))):
    response = supabase.table("menu_items").delete().eq("id", item_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")

@router.patch("/items/{item_id}/toggle", response_model=MenuItemResponse)
async def toggle_availability(item_id: str, _: User = Depends(require_role("staff", "admin"))):
    # Fetch current item
    response = supabase.table("menu_items").select("is_available").eq("id", item_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")
        
    current_status = response.data[0]["is_available"]
    
    # Toggle it
    update_response = supabase.table("menu_items").update({"is_available": not current_status}).eq("id", item_id).execute()
    if not update_response.data:
        raise HTTPException(status_code=500, detail="Failed to toggle availability")
    return update_response.data[0]

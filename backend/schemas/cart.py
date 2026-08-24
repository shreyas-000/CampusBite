from pydantic import BaseModel, ConfigDict
from schemas.menu import MenuItemResponse

class AddItemRequest(BaseModel):
    menu_item_id: str
    quantity: int = 1
    special_instructions: str | None = None

class UpdateItemRequest(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: str
    cart_id: str
    menu_item_id: str
    quantity: int
    special_instructions: str | None = None
    menu_items: MenuItemResponse | None = None # Embedded from Supabase relational query

    model_config = ConfigDict(from_attributes=True)

class CartResponse(BaseModel):
    id: str
    user_id: str
    cart_items: list[CartItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

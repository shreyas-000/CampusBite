from pydantic import BaseModel, ConfigDict
from datetime import datetime
from schemas.menu import MenuItemResponse

class FavouriteResponse(BaseModel):
    id: str
    user_id: str
    menu_item_id: str
    created_at: datetime
    menu_items: MenuItemResponse | None = None # Embedded from Supabase relational query

    model_config = ConfigDict(from_attributes=True)

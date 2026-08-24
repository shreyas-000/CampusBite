from pydantic import BaseModel, ConfigDict
from datetime import datetime

# --- Category Schemas ---

class CategoryBase(BaseModel):
    name: str
    description: str | None = None
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

# --- MenuItem Schemas ---

class MenuItemBase(BaseModel):
    category_id: str | None = None
    name: str
    description: str | None = None
    price: int # Price in paise (e.g. 100 paise = 1 INR)
    image_url: str | None = None
    is_available: bool = True
    available_from: str | None = None # e.g. "08:00:00"
    available_until: str | None = None # e.g. "22:00:00"

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    category_id: str | None = None
    name: str | None = None
    description: str | None = None
    price: int | None = None
    image_url: str | None = None
    is_available: bool | None = None
    available_from: str | None = None
    available_until: str | None = None

class MenuItemResponse(MenuItemBase):
    id: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

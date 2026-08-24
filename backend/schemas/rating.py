from pydantic import BaseModel, ConfigDict
from datetime import datetime

class CreateRatingRequest(BaseModel):
    order_id: str
    menu_item_id: str
    rating: int
    review: str | None = None

class RatingResponse(BaseModel):
    id: str
    order_id: str
    menu_item_id: str
    user_id: str
    rating: int
    review: str | None = None
    created_at: datetime
    
    # We might want to embed the user's name but we'll keep it simple for now
    
    model_config = ConfigDict(from_attributes=True)

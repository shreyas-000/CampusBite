from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SettingsResponse(BaseModel):
    id: int
    is_accepting_orders: bool
    razorpay_enabled: bool
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UpdateSettingsRequest(BaseModel):
    is_accepting_orders: bool | None = None
    razorpay_enabled: bool | None = None

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    placed = "placed"
    confirmed = "confirmed"
    preparing = "preparing"
    ready = "ready"
    picked_up = "picked_up"
    cancelled = "cancelled"

class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"

class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    menu_item_id: str | None = None
    name: str
    quantity: int
    unit_price: int
    special_instructions: str | None = None

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: str
    user_id: str | None = None
    pickup_token: str
    status: OrderStatus
    total: int
    scheduled_pickup_at: datetime | None = None
    payment_status: PaymentStatus
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    created_at: datetime
    order_items: list[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class UpdateStatusRequest(BaseModel):
    status: OrderStatus

class SchedulePickupRequest(BaseModel):
    pickup_at: datetime

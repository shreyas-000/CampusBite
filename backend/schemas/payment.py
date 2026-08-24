from pydantic import BaseModel

class InitiatePaymentRequest(BaseModel):
    order_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentResponse(BaseModel):
    razorpay_order_id: str
    amount: int
    key_id: str

import hmac, hashlib
from fastapi import APIRouter, Depends, HTTPException
import razorpay
from core.config import settings
from core.database import supabase
from core.dependencies import get_current_user
from schemas.user import User
from schemas.payment import InitiatePaymentRequest, VerifyPaymentRequest, PaymentResponse

router = APIRouter()

# Initialize Razorpay Client only if keys are present to avoid startup crashes if missing in dev
def get_razorpay_client():
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

@router.post("/initiate", response_model=PaymentResponse)
async def initiate_payment(body: InitiatePaymentRequest, current_user: User = Depends(get_current_user)):
    # 1. Verify order exists and belongs to user
    order_response = supabase.table("orders").select("*").eq("id", body.order_id).execute()
    if not order_response.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = order_response.data[0]
    
    if str(order.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    client = get_razorpay_client()
    
    # 2. Create Razorpay order
    try:
        rz_order = client.order.create({
            "amount": order["total"], # Amount is already in paise
            "currency": "INR",
            "receipt": str(order["id"]),
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate payment with Razorpay: {str(e)}")

    # 3. Update Supabase order with razorpay_order_id
    supabase.table("orders").update({"razorpay_order_id": rz_order["id"]}).eq("id", order["id"]).execute()

    return PaymentResponse(
        razorpay_order_id=rz_order["id"], 
        amount=order["total"], 
        key_id=settings.razorpay_key_id
    )

@router.post("/verify")
async def verify_payment(body: VerifyPaymentRequest, current_user: User = Depends(get_current_user)):
    if not settings.razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
        
    # 1. Verify signature
    payload = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.razorpay_key_secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # 2. Fetch order to verify existence
    order_response = supabase.table("orders").select("*").eq("razorpay_order_id", body.razorpay_order_id).execute()
    if not order_response.data:
        raise HTTPException(status_code=404, detail="Order not found")

    order = order_response.data[0]

    # 3. Update payment status to paid
    update_data = {
        "payment_status": "paid",
        "razorpay_payment_id": body.razorpay_payment_id
    }
    supabase.table("orders").update(update_data).eq("id", order["id"]).execute()
    
    return {"message": "Payment verified successfully"}

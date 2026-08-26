from fastapi import APIRouter, Depends, HTTPException, status
from core.dependencies import get_current_user
from core.database import supabase
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, create_verification_token, create_password_reset_token
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UpdateProfileRequest, VerifyEmailRequest, ResendVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest
from schemas.user import User
from services.email import send_magic_link_email, send_password_reset_email

router = APIRouter()

@router.post("/register", status_code=201)
async def register(body: RegisterRequest):
    # Check if email exists
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Insert new user with is_active = False
    user_data = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "name": body.name,
        "student_id": body.student_id,
        "department": body.department,
        "role": "student",
        "is_active": False
    }
    
    response = supabase.table("users").insert(user_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    user = response.data[0]
    
    # Generate verification token
    verification_token = create_verification_token(str(user["id"]))
    
    await send_magic_link_email(body.email, verification_token)
    
    return {"message": "Verification email sent. Please check your inbox to activate your account."}

@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(body: VerifyEmailRequest):
    payload = decode_token(body.token)
    if not payload or payload.get("type") != "verify_email":
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
    user_id = payload.get("sub")
    
    # Update user to is_active = True
    response = supabase.table("users").update({"is_active": True}).eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = response.data[0]
    
    # Return auth tokens, logging them in immediately
    return TokenResponse(
        access_token=create_access_token(str(user["id"]), user["role"]),
        refresh_token=create_refresh_token(str(user["id"])),
    )

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    response = supabase.table("users").select("*").eq("email", body.email).execute()
    
    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user = response.data[0]
    
    if not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your account.")
        
    return TokenResponse(
        access_token=create_access_token(str(user["id"]), user["role"]),
        refresh_token=create_refresh_token(str(user["id"])),
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=401, detail="User not found")
        
    user = response.data[0]
    
    return TokenResponse(
        access_token=create_access_token(str(user["id"]), user["role"]),
        refresh_token=create_refresh_token(str(user["id"])),
    )

@router.get("/me", response_model=User)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=User)
async def update_me(body: UpdateProfileRequest, current_user: User = Depends(get_current_user)):
    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.department is not None:
        updates["department"] = body.department
        
    if not updates:
        return current_user
        
    response = supabase.table("users").update(updates).eq("id", current_user.id).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
        
    updated_user = response.data[0]
    return User(**updated_user)

@router.post("/resend-verification")
async def resend_verification(body: ResendVerificationRequest):
    # Check if email exists
    existing = supabase.table("users").select("id, is_active").eq("email", body.email).execute()
    if not existing.data:
        # Return success anyway to prevent email enumeration
        return {"message": "If the email is registered, a verification link has been sent."}
        
    user = existing.data[0]
    if user.get("is_active"):
        return {"message": "Account is already verified."}
        
    # Generate new verification token
    verification_token = create_verification_token(str(user["id"]))
    
    await send_magic_link_email(body.email, verification_token)
    
    return {"message": "Verification email resent. Please check your inbox."}

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    # Check if user exists
    response = supabase.table("users").select("id, is_active").eq("email", body.email).execute()
    
    # We return success message regardless to prevent email enumeration
    if response.data:
        user = response.data[0]
        # Generate reset token
        reset_token = create_password_reset_token(str(user["id"]))
        # Send email
        await send_password_reset_email(body.email, reset_token)
        
    return {"message": "If that email is in our database, we will send a password reset link."}

@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    payload = decode_token(body.token)
    
    if not payload or payload.get("type") != "reset_password":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user_id = payload.get("sub")
    
    # Hash new password
    hashed_pwd = hash_password(body.new_password)
    
    # Update password
    response = supabase.table("users").update({"hashed_password": hashed_pwd}).eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "Password successfully reset. You can now log in."}

import httpx
from core.config import settings

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

async def send_magic_link_email(to_email: str, token: str):
    if not settings.brevo_api_key:
        print("Warning: BREVO_API_KEY is not set. Magic link email will not be sent.")
        return

    magic_link = f"{settings.frontend_url}/auth/verify?token={token}"

    headers = {
        "accept": "application/json",
        "api-key": settings.brevo_api_key,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": settings.brevo_sender_name,
            "email": settings.brevo_sender_email
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": "Verify your email for CampusBite",
        "htmlContent": f"""
        <html>
            <body>
                <h2>Welcome to CampusBite!</h2>
                <p>Click the link below to verify your email address and activate your account:</p>
                <p><a href="{magic_link}">Verify My Email</a></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{magic_link}</p>
                <p>This link will expire in 15 minutes.</p>
            </body>
        </html>
        """
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(BREVO_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            print(f"Verification email sent to {to_email}")
        except httpx.HTTPStatusError as e:
            print(f"Error sending email via Brevo: {e.response.text}")
        except Exception as e:
            print(f"Error sending email via Brevo: {str(e)}")

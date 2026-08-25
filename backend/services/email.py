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
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 600px; width: 100%;">
                            <tr>
                                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">CampusBite</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px 40px 40px 40px;">
                                    <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #18181b;">Welcome to CampusBite!</h2>
                                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #52525b;">
                                        Thank you for signing up. Please verify your email address to activate your account and start ordering.
                                    </p>
                                    <div style="text-align: center; margin-bottom: 24px;">
                                        <a href="{magic_link}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-weight: 500; font-size: 16px; text-decoration: none; padding: 12px 32px; border-radius: 6px;">Verify Email Address</a>
                                    </div>
                                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #71717a;">
                                        If the button above doesn't work, copy and paste the following link into your browser:
                                    </p>
                                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #3b82f6; word-break: break-all;">
                                        <a href="{magic_link}" style="color: #3b82f6; text-decoration: underline;">{magic_link}</a>
                                    </p>
                                    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 24px 0;">
                                    <p style="margin: 0; font-size: 14px; color: #a1a1aa; text-align: center;">
                                        This link will expire in 15 minutes. If you did not request this email, you can safely ignore it.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
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
            print(f"Error sending email via Brevo ({e.response.status_code}): {e.response.text}")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error sending email via Brevo: {str(e)}")

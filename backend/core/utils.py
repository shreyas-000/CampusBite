from core.database import supabase

def create_notification(user_id: str, title: str, body: str) -> None:
    """Helper function to create a notification in Supabase."""
    supabase.table("notifications").insert({
        "user_id": user_id,
        "title": title,
        "body": body
    }).execute()

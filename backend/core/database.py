from supabase import create_client, Client
from .config import settings

# Initialize a stateless Supabase client
# Using the Secret Key allows us to bypass RLS for server-to-server operations if needed,
# or perform admin tasks safely since it is not exposed to the client.
supabase: Client = create_client(settings.supabase_url, settings.supabase_secret_key)

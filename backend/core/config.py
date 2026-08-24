from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str
    supabase_url: str
    supabase_service_key: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    razorpay_key_id: str
    razorpay_key_secret: str
    frontend_url: str = "http://localhost:5173"
    allowed_origins: str = "http://localhost:5173"


settings = Settings()

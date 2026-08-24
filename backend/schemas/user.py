from pydantic import BaseModel, ConfigDict
from datetime import datetime

class User(BaseModel):
    id: str
    email: str
    hashed_password: str
    name: str
    student_id: str | None = None
    department: str | None = None
    role: str = "student"
    is_active: bool = True
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

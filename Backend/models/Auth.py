from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from enum import Enum

class UserCreate(BaseModel):
  name: str = Field(..., min_length=2, max_length=100)
  email: EmailStr
  password: str = Field(..., min_length=8)
  avatar: str | None = None

class LoginRequest(BaseModel):
  email: EmailStr
  password: str = Field(..., min_length=8)

class UserRole(str, Enum):
  student = "student"
  admin = "admin"

class UserOut(BaseModel):
  id: str
  name: str
  email: EmailStr
  avatar: str | None = None
  role: UserRole = UserRole.student
  created_at: datetime
  updated_at: datetime
  last_login: datetime | None = None
  streak: int = 0
  model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
  name: str | None = None
  avatar: str | None = None
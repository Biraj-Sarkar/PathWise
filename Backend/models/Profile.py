from pydantic import BaseModel, Field
from datetime import datetime

class StudentProfileCreate(BaseModel):
  education_level: str | None = None
  interests: list[str] = Field(default_factory=list)
  skills: list[str] = Field(default_factory=list)
  preferred_language: str | None = None
  career_goals: list[str] = []
  learning_style: str | None = None

class StudentProfileUpdate(BaseModel):
  education_level: str | None = None
  interests: list[str] | None = None
  skills: list[str] | None = None
  weak_topics: list[str] | None = None
  strong_topics: list[str] | None = None
  preferred_language: str | None = None
  career_goals: list[str] = []
  learning_style: str | None = None

class StudentProfileOut(BaseModel):
  user_id: str
  education_level: str | None = None
  interests: list[str] = Field(default_factory=list)
  skills: list[str] = Field(default_factory=list)
  weak_topics: list[str] = Field(default_factory=list)
  strong_topics: list[str] = Field(default_factory=list)
  preferred_domain: str | None = None
  preferred_location: str | None = None
  preferred_language: str | None = None
  career_goals: list[str] = []
  learning_style: str | None = None
  created_at: datetime
  updated_at: datetime

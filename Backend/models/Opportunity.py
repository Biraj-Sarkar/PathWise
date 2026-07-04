from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

# =====================================================
# ENUMS
# =====================================================

class OpportunityType(str, Enum):
  SCHOLARSHIP = "Scholarship"
  INTERNSHIP = "Internship"
  HACKATHON = "Hackathon"
  JOB = "Job"
  COURSE = "Course"
  CERTIFICATION = "Certification"
  COMPETITION = "Competition"
  WORKSHOP = "Workshop"
  BOOTCAMP = "Bootcamp"

class OpportunityMode(str, Enum):
  ONLINE = "Online"
  OFFLINE = "Offline"
  HYBRID = "Hybrid"

class OpportunityStatus(str, Enum):
  OPEN = "Open"
  CLOSED = "Closed"
  UPCOMING = "Upcoming"

# =====================================================
# REQUEST
# =====================================================

class OpportunityRequest(BaseModel):
  career_goal: str | None = None
  preferred_domain: str | None = None
  preferred_location: str | None = None
  type: OpportunityType | None = None
  mode: OpportunityMode | None = None

# =====================================================
# FILTER OPPORTUNITIES
# =====================================================

class FilterOpportunities(BaseModel):
  types: list[OpportunityType] | None = None
  keywords: list[str] | None = None
  domains: list[str] | None = None
  locations: list[str] | None = None
  modes: list[OpportunityMode] | None = None

# =====================================================
# OPPORTUNITY
# =====================================================

class Opportunity(BaseModel):
  title: str
  organization: str

  type: OpportunityType
  mode: OpportunityMode
  status: OpportunityStatus

  domain: str
  description: str

  location: str
  deadline: str
  apply_link: str

  skills_required: list[str] = []
  source: str | None = None

# =====================================================
# RESPONSE
# =====================================================

class OpportunityResponse(BaseModel):
  opportunities: list[Opportunity] = []

# =====================================================
# SAVE OPPORTUNITY
# =====================================================

class SaveOpportunity(BaseModel):
  opportunity_id: str

class SavedOpportunity(BaseModel):
  user_id: str
  opportunity_id: str

  saved_at: datetime = Field(default_factory=datetime.now)

# =====================================================
# AI CAREER RECOMMENDATION
# =====================================================

class CareerRecommendation(BaseModel):
  recommended_domains: list[str] = []
  recommended_skills: list[str] = []
  recommended_projects: list[str] = []
  recommended_courses: list[str] = []
  recommended_certifications: list[str] = []
  recommended_internships: list[str] = []
  recommended_hackathons: list[str] = []

  career_summary: str | None = None
  next_steps: list[str] = []

# =====================================================
# SKILL GAP ANALYSIS
# =====================================================

class SkillGapAnalysis(BaseModel):
  target_role: str
  
  matched_skills: list[str] = []
  missing_skills: list[str] = []

  recommended_courses: list[str] = []
  recommended_projects: list[str] = []
  recommended_certifications: list[str] = []

  priority_skills: list[str] = []
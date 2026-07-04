from pydantic import BaseModel
from enum import Enum

# ========== Intent Recognition ==========

class IntentType(str, Enum):
  doubt = "doubt"                  # explain/teach/summarize/definition
  example = "example"              # generate examples
  quiz = "quiz"                    # generate a quiz
  opportunity = "opportunity"      # internships/jobs/courses
  roadmap = "roadmap"              # learning roadmap
  followup = "followup"            # continue previous conversation

class IntentRecognitionResponse(BaseModel):
  intent: IntentType
  confidence: float

# ========= Quiz Difficulty Recognition ==========

class DifficultyLevel(str, Enum):
  easy = "easy"
  medium = "medium"
  hard = "hard"
  adaptive = "adaptive"

class QuizDifficultyResponse(BaseModel):
  difficulty_level: DifficultyLevel

# ========= Quiz Generation ==========

class Questions(BaseModel):
  question_id: str
  topic: str
  subtopic: str
  difficulty_level: DifficultyLevel
  question: str
  options: list[str]
  correct_answer: str
  explanation: str

class QuizResponse(BaseModel):
  quiz_title: str
  recommended_prerequisites: list[str]
  recommended_next_topics: list[str]
  questions: list[Questions]

# ======== Performance Analysis ==========

class PerformanceResponse(BaseModel):
  performance_summary: str
  weak_subtopics_identified: list[str]
  strong_subtopics_identified: list[str]
  recommended_topics: list[str]
  study_plan: list[str]
  next_quiz_difficulty_recommendation: DifficultyLevel
  motivational_message: str

# ========= Topic Recognition ==========

class TopicRecognitionResponse(BaseModel):
  topic: str
  subtopic: str
  found: bool

# ========= Doubt Resolution ==========

class DoubtResponseType(str, Enum):
  definition = "definition"
  explanation = "explanation"
  teaching = "teaching"
  summary = "summary"
  comparison = "comparison"
  step_by_step = "step_by_step"

class DoubtResponse(BaseModel):
  intent: DoubtResponseType
  answer: str
  examples: list[str]
  real_world_application: str
  additional_resources: list[str]

# ======== Example Generation ==========

class Example(BaseModel):
  title: str
  example: str
  explanation: str
  real_world_application: str

class ExampleResponse(BaseModel):
  examples: list[Example]

# ======== Quiz Review ==========

class QuizReviewResponse(BaseModel):
  is_correct: bool
  explanation: str
  concept_review: str
  common_mistakes: list[str]
  memory_trick: str

# ======== Learning Roadmap ==========

class CurrentLevel(str, Enum):
  beginner = "Beginner"
  learning = "Learning"
  proficient = "Proficient"
  mastered = "Mastered"

class Roadmap(BaseModel):
  step: int
  title: str
  description: str

class LearningRoadmapResponse(BaseModel):
  current_level: CurrentLevel
  roadmap: list[Roadmap]
  revision_topics: list[str]
  next_topics: list[str]

# ======== Career Guidance and Opportunities ==========

class CareerGuidance(BaseModel):
  career_summary: str
  recommended_skills: list[str]
  recommended_projects: list[str]
  recommended_courses: list[str]
  recommended_certifications: list[str]
  next_steps: list[str]

class OpportunityType(str, Enum):
  internship = "Internship"
  job = "Job"
  course = "Course"
  certification = "Certification"
  hackathon = "Hackathon"
  competition = "Competition"
  scholarship = "Scholarship"
  bootcamp = "Bootcamp"
  workshop = "Workshop"

class OpportunityMode(str, Enum):
  online = "Online"
  offline = "Offline"
  hybrid = "Hybrid"

class OpportunityStatus(str, Enum):
  open = "Open"
  closed = "Closed"
  upcoming = "Upcoming"

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
  skills_required: list[str]
  source: str | None = None

class OpportunityResponse(BaseModel):
  career_guidance: CareerGuidance
  opportunities: list[Opportunity]

class OpportunityFilterResponse(BaseModel):
  results: list[Opportunity]
 
# ======== Filter Extraction ==========

class FilterExtractResponse(BaseModel):
  keywords: list[str]
  domains: list[str]
  opportunity_types: list[OpportunityType]
  locations: list[str]
  modes: list[OpportunityMode]
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class Difficulty(str, Enum):
  easy = "easy"
  medium = "medium"
  hard = "hard"
  adaptive = "adaptive"

# =========================
# QUIZ
# =========================

class QuizRequest(BaseModel):
  topic: str
  education_level: str | None = None
  level: Difficulty = Difficulty.easy
  requested_at: datetime = Field(default_factory=datetime.now)

class QuizQuestion(BaseModel):
  question_id: str
  topic: str
  subtopic: str
  difficulty_level: Difficulty
  question: str
  options: list[str]
  correct_answer: str
  explanation: str

class AnswerSubmission(BaseModel):
  question_id: str
  answer_submitted: str

class QuizResult(BaseModel):
  quiz_id: str
  answers: list[AnswerSubmission]
  attempted_at: datetime = Field(default_factory=datetime.now)

# =========================
# LEARNING CHAT
# =========================

class LearningRequest(BaseModel):
  session_id: str | None = None
  message: str

class ChatMessage(BaseModel):
  session_id: str
  sender: str  # "user" or "ai"
  topic: str | None = None
  subtopic: str | None = None
  message: str
  timestamp: datetime = Field(default_factory=datetime.now)

# =========================
# LEARNING TIME
# =========================

class LearningTime(BaseModel):
  topic: str
  subtopic: str
  time_spent_seconds: float

# =========================
# EXAMPLE REQUEST
# =========================

class ExampleRequest(BaseModel):
  session_id: str
  example_query: str

# =========================
# QUIZ REVIEW REQUEST
# =========================

class QuizReviewRequest(BaseModel):
  quiz_id: str
  question_ids: list[str]

# =========================
# PERFORMANCE ANALYSIS
# =========================

class PerformanceAnalysis(BaseModel):
  performance_summary: str
  weak_subtopics_identified: list[str]
  strong_subtopics_identified: list[str]
  recommended_topics: list[str]
  study_plan: list[str]
  next_quiz_difficulty_recommendation: Difficulty
  motivational_message: str

# =========================
# LEARNING PROGRESS
# =========================

# 0-40   Beginner
# 41-60  Learning
# 61-80  Proficient
# 81-100 Mastered

class LearningProgress(BaseModel):
  user_id: str
  topic: str
  subtopic: str
  # Difficulty statistics
  easy_attempted: int = 0
  medium_attempted: int = 0
  hard_attempted: int = 0
  easy_correct: int = 0
  medium_correct: int = 0
  hard_correct: int = 0
  # Aggregate statistics
  questions_attempted: int = 0
  questions_correct: int = 0
  accuracy: float = 0.0
  # Quiz timing
  total_quiz_time: float = 0.0
  avg_time_per_question: float = 0.0
  # Learning activity
  learning_time: float = 0.0
  # Learning behavior
  example_requests: int = 0
  solution_explanation_requests: int = 0
  # Recent performance
  recent_accuracy: float = 0.0
  # Mastery
  mastery_score: float = 0.0
  status: str = "Beginner"
  last_attempted_at: datetime | None = None
  created_at: datetime = Field(default_factory=datetime.now)
  updated_at: datetime = Field(default_factory=datetime.now)

# =========================
# SESSION CONTEXT
# =========================

class LearningSessionContext(BaseModel):
  session_id: str
  user_id: str
  topic: str | None = None
  current_subtopic: str | None = None
  last_message_at: datetime = Field(default_factory=datetime.now)
  created_at: datetime = Field(default_factory=datetime.now)
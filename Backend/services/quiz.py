from datetime import datetime
from typing import Any
from bson import ObjectId

from models.Learning import QuizRequest, QuizResult
from services.prompts import quizPrompt
from services.callAI import quiz_generate

async def generate_quiz(quiz_request: QuizRequest, user: dict[str, Any], db):
  profile = await db["profiles"].find_one({"user_id": user["_id"]})

  topic = quiz_request.topic
  difficulty_level = quiz_request.level

  requested_at = quiz_request.requested_at

  prompt = quizPrompt(
    student_name=user["name"],
    education_level=profile.get("education_level", "General") if profile else "General",
    topic=topic,
    difficulty_level=difficulty_level,
    preferred_language=profile.get("preferred_language", "English") if profile else "English",
    weak_topics=profile.get("weak_topics", []) if profile else [],
    strong_topics=profile.get("strong_topics", []) if profile else []
  )

  generated_quiz = quiz_generate(prompt)

  quiz_document = {
    "_id": ObjectId(),
    "user_id": user["_id"],
    "topic": topic,
    "difficulty_level": difficulty_level,
    **(generated_quiz.model_dump() if hasattr(generated_quiz, "model_dump") else generated_quiz),
    "requested_at": requested_at
  }

  await db["quizzes"].insert_one(quiz_document)

  return {
    "success": True,
    "message": "Quiz generated successfully.",
    "data": {
      "quiz_id": str(quiz_document["_id"]),
      **generated_quiz.model_dump()
    }
  }
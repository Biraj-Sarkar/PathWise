from datetime import datetime
from bson import ObjectId

async def progress_tracking(user_id: ObjectId, topic: str, subtopic: str, db):
  progress = await db["learning_progress"].find_one({
    "user_id": user_id,
    "topic": topic,
    "subtopic": subtopic
  })

  if progress:
    return progress

  progress = {
    "user_id": user_id,
    "topic": topic,
    "subtopic": subtopic,
    "easy_attempted": 0,
    "medium_attempted": 0,
    "hard_attempted": 0,
    "easy_correct": 0,
    "medium_correct": 0,
    "hard_correct": 0,
    "questions_attempted": 0,
    "questions_correct": 0,
    "accuracy": 0.0,
    "learning_time": 0.0,
    "example_requests": 0,
    "solution_explanation_requests": 0,
    "recent_accuracy": 0.0,
    "mastery_score": 0.0,
    "status": "Beginner",
    "last_attempted_at": None,
    "updated_at": datetime.now(),
    "created_at": datetime.now()
  }

  result  = await db["learning_progress"].insert_one(progress)
  progress["_id"] = result.inserted_id

  return progress
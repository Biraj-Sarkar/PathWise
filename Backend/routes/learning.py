from datetime import datetime
import traceback
from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import ValidationError

from middlewares.authMiddleware import get_user

from utils.get_db import get_db
from utils.get_progress import progress_tracking

from models.Learning import LearningTime

from services.callAI import generate_learning_roadmap
from services.learning import get_roadmap
from services.calculateMastery import calculate_mastery_status, get_status

router = APIRouter(prefix="/learning", tags=["Learning"])

# =====================================================
# LEARNING TIME
# =====================================================

@router.post("/learning-time")
async def learning_time(learning_time: LearningTime, user=Depends(get_user), db=Depends(get_db)):
  try:
    progress = await progress_tracking(user["_id"], learning_time["topic"], learning_time["subtopic"], db)

    current_learning_time = progress["learning_time"]
    progress["learning_time"] = current_learning_time + learning_time.time_spent_seconds
    progress["accuracy"] = (progress.get("questions_correct", 0) / max(progress.get("questions_attempted", 1), 1)) * 100

    mastery_status = calculate_mastery_status(progress)

    progress["mastery_score"] = mastery_status["mastery_score"]
    progress["status"] = mastery_status["status"]

    progress["updated_at"] = datetime.now()

    updated_progress = progress.copy()
    updated_progress.pop("_id", None)
    updated_progress.pop("user_id", None)

    await db["learning_progress"].update_one(
      {"_id": progress["_id"]},
      {"$set": updated_progress}
    )

    return {
      "success": True,
      "message": "Learning time updated successfully",
      "data": updated_progress
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# LEARNING PROGRESS
# =====================================================

@router.get("/progress")
async def get_learning_progress(user=Depends(get_user), db=Depends(get_db)):
  try:
    progress_cursor = await db["learning_progress"].find({"user_id": user["_id"]}).to_list(length=None)

    topic_stats = {}
    all_masteries = []
    total_questions_attempted = 0
    total_questions_correct = 0
    total_hard_attempted = 0

    for progress in progress_cursor:
      topic = progress.get("topic", "Unknown")
      mastery_score = progress.get("mastery_score", 0.0)
      questions_attempted = progress.get("questions_attempted", 0)
      questions_correct = progress.get("questions_correct", 0)
      hard_attempted = progress.get("hard_attempted", 0)

      if topic not in topic_stats:
        topic_stats[topic] = {
          "topic": topic,
          "mastery_scores": [],
          "questions_attempted": 0,
          "questions_correct": 0,
          "hard_attempted": 0
        }
      
      topic_stats[topic]["mastery_scores"].append(mastery_score)
      topic_stats[topic]["questions_attempted"] += questions_attempted
      topic_stats[topic]["questions_correct"] += questions_correct
      topic_stats[topic]["hard_attempted"] += hard_attempted

      all_masteries.append(mastery_score)

      total_questions_attempted += questions_attempted
      total_questions_correct += questions_correct
      total_hard_attempted += hard_attempted
    
    topics = []

    for topic, data in topic_stats.items():
      questions_attempted = data["questions_attempted"]
      questions_correct = data["questions_correct"]
      hard_attempted = data["hard_attempted"]

      mastery_score = round(sum(data["mastery_scores"]) / max(len(data["mastery_scores"]), 1), 2)
      accuracy = round((questions_correct / max(questions_attempted, 1)) * 100, 2)

      topics.append({
        "topic": topic,
        "mastery_score": mastery_score,
        "status": get_status(mastery_score, questions_attempted, hard_attempted),
        "accuracy": accuracy,
        "questions_attempted": questions_attempted
      })
    
    topics.sort(key=lambda x: x["topic"])

    overall_mastery = round(sum(all_masteries) / max(len(all_masteries), 1), 2)
    overall_status = get_status(overall_mastery, total_questions_attempted, total_hard_attempted)

    return {
      "success": True,
      "message": "Learning progress retrieved successfully.",
      "data": {
        "overall_mastery": overall_mastery,
        "overall_status": overall_status,
        "topics": topics
      }
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# TOPIC ANALYTICS
# =====================================================

@router.get("/progress/{topic}")
async def get_topic_analytics(topic: str, user: dict = Depends(get_user), db=Depends(get_db)):
  try:
    progress_cursor = await db["learning_progress"].find({"user_id": user["_id"], "topic": topic}).to_list(length=None)

    subtopic_stats = {}
    all_masteries = []
    total_questions_attempted = 0
    total_questions_correct = 0
    total_hard_attempted = 0

    for progress in progress_cursor:
      subtopic = progress.get("subtopic", "Unknown")
      mastery_score = progress.get("mastery_score", 0.0)
      questions_attempted = progress.get("questions_attempted", 0)
      questions_correct = progress.get("questions_correct", 0)
      hard_attempted = progress.get("hard_attempted", 0)
      learning_time = progress.get("learning_time", 0)
      example_requests = progress.get("example_requests", 0)
      solution_explanation_requests = progress.get("solution_explanation_requests", 0)

      if subtopic not in subtopic_stats:
        subtopic_stats[subtopic] = {
          "subtopic": subtopic,
          "mastery_scores": [],
          "questions_attempted": 0,
          "questions_correct": 0,
          "hard_attempted": 0,
          "learning_time": 0,
          "example_requests": 0,
          "solution_explanation_requests": 0
        }

      subtopic_stats[subtopic]["mastery_scores"].append(mastery_score)
      subtopic_stats[subtopic]["questions_attempted"] += questions_attempted
      subtopic_stats[subtopic]["questions_correct"] += questions_correct
      subtopic_stats[subtopic]["hard_attempted"] += hard_attempted
      subtopic_stats[subtopic]["learning_time"] += learning_time
      subtopic_stats[subtopic]["example_requests"] += example_requests
      subtopic_stats[subtopic]["solution_explanation_requests"] += solution_explanation_requests

      all_masteries.append(mastery_score)

      total_questions_attempted += questions_attempted
      total_questions_correct += questions_correct
      total_hard_attempted += hard_attempted

    subtopics = []

    for subtopic, data in subtopic_stats.items():
      questions_attempted = data["questions_attempted"]
      questions_correct = data["questions_correct"]
      hard_attempted = data["hard_attempted"]

      mastery_score = round(sum(data["mastery_scores"]) / max(len(data["mastery_scores"]), 1), 2)
      accuracy = round((questions_correct / max(questions_attempted, 1)) * 100, 2)

      subtopics.append({
        "subtopic": subtopic,
        "questions_attempted": questions_attempted,
        "questions_correct": questions_correct,
        "accuracy": accuracy,
        "mastery_score": mastery_score,
        "status": get_status(mastery_score, questions_attempted, hard_attempted),
        "learning_time": data["learning_time"],
        "example_requests": data["example_requests"],
        "solution_explanation_requests": data["solution_explanation_requests"]
      })

    subtopics.sort(key=lambda x: x["subtopic"])

    overall_mastery = round(sum(all_masteries) / max(len(all_masteries), 1), 2)
    overall_status = get_status(overall_mastery, total_questions_attempted, total_hard_attempted)

    return {
      "success": True,
      "message": "Learning progress retrieved successfully.",
      "data": {
        "topic": topic,
        "overall_mastery": overall_mastery,
        "overall_status": overall_status,
        "subtopics": subtopics
      }
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
# =====================================================
# LEARNING HISTORY
# =====================================================

@router.get("/history")
async def get_learning_history(user=Depends(get_user), db=Depends(get_db)):
  try:
    attempts = await db["quiz_attempts"].find({"user_id": user["_id"]}).sort("attempted_at", -1).to_list(length=None)

    history = []
    for attempt in attempts:
      difficulty = await db["quizzes"].find_one({"_id": attempt.get("quiz_id")}, sort=[("created_at", -1)])
      history.append({
        "quiz_id": str(attempt.get("quiz_id")),
        "topic": attempt.get("topic"),
        "percentage_score": attempt.get("percentage_score", 0.0),
        "attempted_at": attempt.get("attempted_at"),
        "difficulty_level": difficulty.get("difficulty_level") if difficulty else None
      })

    return {
      "success": True,
      "message": "Learning history retrieved successfully.",
      "data": history
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# LEARNING ROADMAP
# =====================================================

@router.get("/roadmap/{topic}")
async def get_learning_roadmap(topic: str, user=Depends(get_user), db=Depends(get_db)):
  try:
    result = await get_roadmap(topic, user, db)

    return result
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# ALL ROADMAPS
# =====================================================

@router.get("/roadmaps")
async def get_all_roadmaps(user=Depends(get_user), db=Depends(get_db)):
  try:
    roadmaps = await db["roadmaps"].find({"user_id": user["_id"]}).sort("updated_at", -1).to_list(length=None)

    roadmap_list = []
    for roadmap in roadmaps:
      roadmap_list.append({
        "topic": roadmap.get("topic"),
        "roadmap": roadmap.get("roadmap"),
        "updated_at": roadmap.get("updated_at")
      })

    return {
      "success": True,
      "message": "All learning roadmaps retrieved successfully.",
      "data": roadmap_list
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# DELETE ROADMAP
# =====================================================

@router.delete("/roadmap/{topic}")
async def delete_learning_roadmap(topic: str, user=Depends(get_user), db=Depends(get_db)):
  try:
    result = await db["roadmaps"].delete_one({"user_id": user["_id"], "topic": topic})

    if result.deleted_count > 0:
      return {
        "success": True,
        "message": f"Learning roadmap for topic '{topic}' deleted successfully."
      }
    else:
      return {
        "success": False,
        "message": f"No learning roadmap found for topic '{topic}'."
      }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# DELETE ALL ROADMAPS
# =====================================================

@router.delete("/roadmaps")
async def delete_all_roadmaps(user=Depends(get_user), db=Depends(get_db)):
  try:
    result = await db["roadmaps"].delete_many({"user_id": user["_id"]})

    return {
      "success": True,
      "message": f"Deleted {result.deleted_count} learning roadmaps."
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# ALL CHAT HISTORY
# =====================================================

@router.get("/chat-history")
async def get_chat_history(user=Depends(get_user), db=Depends(get_db)):
  try:
    chat_history = await db["chat_history"].find({"user_id": user["_id"]}).sort("timestamp", -1).to_list(length=None)

    history = {}
    for msg in chat_history:
      msg.pop("_id", None)
      msg["user_id"] = str(msg.get("user_id"))
      msg["session_id"] = str(msg.get("session_id"))
      
      if msg["session_id"] not in history:
        history[msg["session_id"]] = []
      history[msg["session_id"]].append(msg)

    return {
      "success": True,
      "message": "Chat history retrieved successfully.",
      "data": history
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# ========================================================
# DELETE CHAT HISTORY
# ========================================================

@router.delete("/chat-history/{session_id}")
async def delete_chat_history(session_id: str, user=Depends(get_user), db=Depends(get_db)):
  try:
    result = await db["chat_history"].delete_many({"user_id": user["_id"], "session_id": session_id})

    if result.deleted_count > 0:
      return {
        "success": True,
        "message": f"Deleted {result.deleted_count} messages from chat history for session {session_id}.",
      }
    else:
      return {
        "success": False,
        "message": f"No messages found for session {session_id}.",
      }    
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
# =====================================================
# DELETE ALL CHAT HISTORY
# =====================================================

@router.delete("/chat-history")
async def delete_all_chat_history(user=Depends(get_user), db=Depends(get_db)):
  try:
    result = await db["chat_history"].delete_many({"user_id": user["_id"]})

    return {
      "success": True,
      "message": f"Deleted {result.deleted_count} messages from chat history.",
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
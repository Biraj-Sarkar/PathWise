from datetime import datetime
import traceback
from fastapi import APIRouter, HTTPException, Depends
from pydantic import ValidationError
from bson import ObjectId

from models.Learning import QuizRequest, QuizResult, QuizReviewRequest, QuizQuestion

from services.prompts import quizReviewPrompt, performanceAnalysisPrompt
from services.callAI import performance_analysis, evaluate_quiz, quiz_review_explanation
from services.quiz import generate_quiz

from middlewares.authMiddleware import get_user

from utils.get_db import get_db
from utils.get_progress import progress_tracking

router = APIRouter(prefix="/quiz", tags=["Quiz"])

# ===================================================== 
# MASTERY SCORE
# ===================================================== 

def calculate_mastery_score(
  accuracy: float = 0.0,
  easy_accuracy: float = 0.0,
  medium_accuracy: float = 0.0,
  hard_accuracy: float = 0.0,
  questions_attempted: int = 0,
  learning_time_seconds: int = 0,
  example_requests: int = 0,
  solution_explanations_requested: int = 0,
):
  accuracy_score = accuracy

  difficulty_score = (easy_accuracy * 0.20) + (medium_accuracy * 0.30) + (hard_accuracy * 0.50)

  experience_score = min(questions_attempted, 100)

  engagement_score = min(learning_time_seconds / 3600 * 20, 100)

  confidence_score = 100 - example_requests * 2 - solution_explanations_requested * 3
  confidence_score = max(confidence_score, 0)

  mastery_score = (
    accuracy_score * 0.40 +
    difficulty_score * 0.25 +
    experience_score * 0.15 +
    engagement_score * 0.10 +
    confidence_score * 0.10
  )

  return round(mastery_score, 2)

def get_status(
  mastery_score: float,
  questions_attempted: int,
  hard_attempted: int,
):
  if questions_attempted < 20:
    return "Beginner"
  
  if mastery_score < 41:
    return "Beginner"
  
  if mastery_score < 61:
    return "Learning"

  if mastery_score < 81:
    return "Proficient"

  if hard_attempted < 20:
    return "Proficient"

  return "Mastered"

# ===================================================== 
# QUIZ REQUEST 
# =====================================================

@router.post("/request")
async def request_quiz(quiz_request: QuizRequest, user = Depends(get_user), db = Depends(get_db)):
  try:
    result = await generate_quiz(quiz_request, user, db)
    return result
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# ===================================================== 
# QUIZ SUBMIT 
# =====================================================

@router.post("/submit")
async def submit_quiz(quiz_result: QuizResult, user = Depends(get_user), db = Depends(get_db)):
  try:
    user_id = str(user["_id"])

    quiz_doc = await db["quizzes"].find_one({"_id": ObjectId(quiz_result.quiz_id)})
    if not quiz_doc: 
      raise HTTPException( status_code=404, detail="Quiz not found." )
    
    questions = [QuizQuestion(**q) for q in quiz_doc["questions"]]
    evaluation = evaluate_quiz(questions, quiz_result.answers)
    
    topic = quiz_doc.get("topic") or quiz_doc.get("topic", None)
    
    await db["quiz_attempts"].insert_one({
      "user_id": ObjectId(user_id),
      "quiz_id": ObjectId(quiz_result.quiz_id),
      "topic": topic,
      "percentage_score": evaluation.get("percentage_score", 0.0),
      "review_results": evaluation.get("review_results", []),
      "attempted_at": quiz_result.attempted_at
    })

    subtopics = list(set(q.subtopic if hasattr(q, 'subtopic') else "Unknown" for q in questions))

    for subtopic in subtopics:
      progress = await progress_tracking(user_id, topic, subtopic, db)
    
      for result in evaluation["review_results"]:
        if result["subtopic"] != subtopic:
          continue

        difficulty = result["difficulty_level"]
        progress[f"{difficulty}_attempted"] += 1
        progress["questions_attempted"] += 1

        if result["is_correct"]:
          progress[f"{difficulty}_correct"] += 1
          progress["questions_correct"] += 1
        
      progress["accuracy"] = (progress["questions_correct"] / max(progress["questions_attempted"], 1)) * 100

      easy_accuracy = (progress["easy_correct"] / max(progress["questions_attempted"], 1)) * 100
      medium_accuracy = (progress["medium_correct"] / max(progress["questions_attempted"], 1)) * 100
      hard_accuracy = (progress["hard_correct"] / max(progress["questions_attempted"], 1)) * 100

      progress["mastery_score"] = calculate_mastery_score(
        accuracy=progress["accuracy"],
        easy_accuracy=easy_accuracy,
        medium_accuracy=medium_accuracy,
        hard_accuracy=hard_accuracy,
        questions_attempted=progress["questions_attempted"],
        learning_time_seconds=progress.get("learning_time", 0.0),
        example_requests=progress.get("example_requests", 0),
        solution_explanations_requested=progress.get("solution_explanation_requests", 0)
      )

      progress["status"] = get_status(
        mastery_score=progress["mastery_score"],
        questions_attempted=progress["questions_attempted"],
        hard_attempted=progress["hard_attempted"]
      )

      progress["last_attempted_at"] = quiz_result.attempted_at
      progress["updated_at"] = datetime.now()

      updated_progress = progress.copy()
      updated_progress.pop("_id", None)

      await db["learning_progress"].update_one(
        {"_id": progress["_id"]},
        {"$set": updated_progress}
      )
    
    profile = await db["profiles"].find_one({"user_id": user_id})
    
    weak_topics = evaluation.get("weak_subtopics", [])
    strong_topics = evaluation.get("strong_subtopics", [])

    await db["profiles"].update_one(
      {"user_id": user_id},
      {"$set": {
        "weak_topics": weak_topics,
        "strong_topics": strong_topics
      }},
      upsert=True
    )

    analysis_prompt = performanceAnalysisPrompt(
      student_name=user["name"],
      education_level=profile.get("education_level", "General") if profile else "General",
      topic=topic,
      percentage_score=evaluation.get("percentage_score", 0.0),
      weak_subtopics=weak_topics,
      strong_subtopics=strong_topics,
      mastery_score=max([
        p.get("mastery_score", 0.0) for p in await db["learning_progress"].find({"user_id": user_id, "topic": topic, "subtopic": subtopic}).to_list(length=None)
      ] or [0]),
      current_status=max([
        p.get("status", "Beginner") for p in await db["learning_progress"].find({"user_id": user_id, "topic": topic, "subtopic": subtopic}).to_list(length=None)
      ] or ["Beginner"])
    )

    analysis = performance_analysis(analysis_prompt)

    return {
      "success": True,
      "message": "Quiz submitted successfully.",
      "quiz_id": quiz_result.quiz_id,
      "data": {
        "evaluation": evaluation,
        "analysis": analysis
      }
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
# =====================================================
# FETCH QUIZ QUESTIONS
# =====================================================

@router.get("/fetch/{quiz_id}")
async def fetch_quiz(quiz_id: str, user=Depends(get_user), db=Depends(get_db)):
  try:
    user_id = str(user["_id"])
    quiz_doc = await db["quiz_attempts"].find_one({"quiz_id": ObjectId(quiz_id), "user_id": ObjectId(user_id)})
    if not quiz_doc:
      raise HTTPException(status_code=404, detail="Quiz not found.")
    
    return_doc = {
      "quiz_id": str(quiz_doc["quiz_id"]),
      "topic": quiz_doc.get("topic"),
      "percentage_score": quiz_doc.get("percentage_score"),
      "review_results": quiz_doc.get("review_results"),
      "attempted_at": quiz_doc.get("attempted_at"),
    }

    return {
      "success": True,
      "message": "Quiz fetched successfully.",
      "data": return_doc
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# QUIZ REVIEW
# =====================================================

@router.post("/review")
async def quiz_review(quiz_review_request: QuizReviewRequest, user=Depends(get_user), db=Depends(get_db)):
  try:
    user_id = str(user["_id"])
    profile = await db["profiles"].find_one({"user_id": user_id})
    attempt = await db["quiz_attempts"].find_one({"quiz_id": ObjectId(quiz_review_request.quiz_id), "user_id": ObjectId(user_id)})

    if not attempt:
      raise HTTPException(status_code=404, detail="Quiz attempt not found.")
    
    reviews = []

    for question_id in quiz_review_request.question_ids:
      review = next((r for r in attempt.get("review_results", []) if r["question_id"] == question_id), None)
      if not review:
        continue

      prompt = quizReviewPrompt(
        student_name=user["name"],
        education_level=profile.get("education_level", "General") if profile else "General",
        topic=review["topic"],
        question=review["question"],
        user_answer=review.get("submitted_answer"),
        correct_answer=review["correct_answer"],
        explanation=review.get("explanation"),
        preferred_language=profile.get("preferred_language", "English") if profile else "English"
      )

      ai_review = quiz_review_explanation(prompt)
      review["ai_review"] = ai_review.model_dump() if hasattr(ai_review, "model_dump") else ai_review
      reviews.append(review)

      progress = await progress_tracking(user_id, review["topic"], review["subtopic"], db)

      easy_accuracy = (progress["easy_correct"] / max(progress["questions_attempted"], 1)) * 100
      medium_accuracy = (progress["medium_correct"] / max(progress["questions_attempted"], 1)) * 100
      hard_accuracy = (progress["hard_correct"] / max(progress["questions_attempted"], 1)) * 100

      progress["solution_explanation_requests"] += 1

      progress["mastery_score"] = calculate_mastery_score(
        accuracy=progress.get("accuracy", 0.0),
        easy_accuracy=easy_accuracy,
        medium_accuracy=medium_accuracy,
        hard_accuracy=hard_accuracy,
        questions_attempted=progress.get("questions_attempted", 0),
        learning_time_seconds=progress.get("learning_time", 0.0),
        example_requests=progress.get("example_requests", 0),
        solution_explanations_requested=progress.get("solution_explanation_requests", 0)
      )

      await db["learning_progress"].update_one(
        {"_id": progress["_id"]},
        {"$set": {
          "solution_explanation_requests": progress["solution_explanation_requests"],
          "mastery_score": progress["mastery_score"],
          "updated_at": datetime.now()
        }}
      )

    return {
      "success": True,
      "message": "Quiz review explanations generated successfully.",
      "data": {
        "reviews": reviews
      }
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
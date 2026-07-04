import traceback

from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from google.genai.errors import ServerError
from typing import Any

from services.callAI import recognize_intent, recognize_difficulty_level
from services.learning import learning_chat, generate_example, get_roadmap
from services.topicRecognition import recognize_topic_and_subtopic
from services.prompts import intentRecognitionPrompt
from services.quiz import generate_quiz
from services.opportunityFilter import opportunity_filter

from middlewares.authMiddleware import get_user
from utils.get_db import get_db
from utils.get_conversation_history import get_conversation_history

router = APIRouter(prefix="/playground", tags=["Playground"])

@router.post("/intent")
async def intent_recognition(request: Request, user: Any = Depends(get_user), db: Any = Depends(get_db)):
  data = await request.json()
  session_id = data.get("session_id") or str(ObjectId())
  topic = data.get("topic") or None
  subtopic = data.get("subtopic") or None
  user_message = data.get("message")
  message_at = data.get("message_at") or datetime.now()

  profile = await db["profiles"].find_one({"user_id": user["_id"]})

  if not user_message:
    raise HTTPException(status_code=400, detail="Message is required")
  
  try:
    prompt = intentRecognitionPrompt(user_message)
    intent_response = recognize_intent(prompt)
    result = None

    print(f"Recognized intent: {intent_response.intent} with confidence: {intent_response.confidence}")

    match intent_response.intent:
      case "doubt":
        learning_request = {
          "session_id": session_id,
          "message": user_message
        }

        result = await learning_chat(learning_request, user, db)

      case "example":
        example_request = {
          "session_id": session_id,
          "example_query": user_message
        }

        result = await generate_example(example_request, user, db)

      case "quiz":
        conversation_history = await get_conversation_history(user, db, session_id)
        
        if not topic:
          topic, _ = await recognize_topic_and_subtopic(user_message, conversation_history, db)
        
        difficulty_level = recognize_difficulty_level(user_message)
        
        quiz_request = {
          "topic": topic,
          "education_level": profile.get("education_level", "General") if profile else "General",
          "level": difficulty_level,
          "requested_at": message_at
        }

        result = await generate_quiz(quiz_request, user, db)
      
      case "opportunity":
        result = await opportunity_filter(user, profile, user_message, db)
      
      case "roadmap":
        conversation_history = await get_conversation_history(user, db, ObjectId(session_id))

        if not topic:
          topic, _ = await recognize_topic_and_subtopic(user_message, conversation_history, db)
        
        result = await get_roadmap(topic, user, db)
      
      case "followup":
        learning_request = {
          "session_id": session_id,
          "message": user_message
        }

        result = await learning_chat(learning_request, user, db)

    return {
        "intent": intent_response.intent,
        "confidence": intent_response.confidence,
        "session_id": str(session_id),
        **result
      }
  except ServerError:
    raise HTTPException(
        status_code=503,
        detail="Gemini is temporarily unavailable. Please try again in a few seconds."
    )
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=500, detail=str(e))
import json

from datetime import datetime
from typing import Any
from bson import ObjectId

from models.Learning import LearningRequest, ExampleRequest, LearningTime

from services.prompts import doubtResolutionPrompt, exampleGenerationPrompt, learningRoadmapPrompt
from services.callAI import doubt_resolution, example_generation, generate_learning_roadmap
from services.topicRecognition import recognize_topic_and_subtopic
from services.calculateMastery import calculate_mastery_score, get_status

from utils.get_progress import progress_tracking
from utils.get_conversation_history import get_conversation_history

# =====================================================
# LEARNING CHAT
# =====================================================

async def learning_chat(learning_request: LearningRequest, user: dict[str, Any], db):
  profile = await db["profiles"].find_one({"user_id": user["_id"]})
  session_id = ObjectId(learning_request["session_id"])
  
  conversation_history = await get_conversation_history(user, db, session_id, limit=6)

  topic, subtopic = await recognize_topic_and_subtopic(learning_request["message"], conversation_history, db)
  
  prompt = doubtResolutionPrompt(
    student_name=user["name"],
    education_level=profile.get("education_level", "General") if profile else "General",
    topic=topic,
    subtopic=subtopic,
    conversation_history=conversation_history,
    user_message=learning_request["message"],
    preferred_language=profile.get("preferred_language", "English") if profile else "English"
  )

  ai_response = doubt_resolution(prompt)

  if ai_response is None:
    raise ValueError("Gemini failed to generate valid JSON.")

  await db["chat_history"].insert_one({
    "user_id": user["_id"],
    "session_id": session_id,
    "sender": "user",
    "topic": topic,
    "subtopic": subtopic,
    "message": learning_request["message"],
    "timestamp": datetime.now()
  })

  msg_to_store = {
    "answer": ai_response.answer,
    "examples": ai_response.examples
  }
  
  await db["chat_history"].insert_one({
    "user_id": user["_id"],
    "session_id": session_id,
    "sender": "assistant",
    "topic": topic,
    "subtopic": subtopic,
    "message": msg_to_store,
    "timestamp": datetime.now()
  })

  return {
    "success": True,
    "message": "Response generated successfully.",
    "data": {
      "session_id": str(session_id),
      "topic": topic,
      "subtopic": subtopic,
      "answer": ai_response.answer,
      "examples": ai_response.examples,
      "real_world_application": ai_response.real_world_application,
      "additional_resources": ai_response.additional_resources
    }
  }

# =====================================================
# EXAMPLE REQUEST
# =====================================================

async def generate_example(example_request: ExampleRequest, user: dict[str, Any], db):
  profile = await db["profiles"].find_one({"user_id": user["_id"]})
  previous_examples = []

  session_id = ObjectId(example_request["session_id"])

  conversation_history = await get_conversation_history(user, db, session_id, limit=6)
  topic, subtopic = await recognize_topic_and_subtopic(example_request["example_query"], conversation_history, db)

  previous_chat = await db["chat_history"].find({"user_id": user["_id"], "topic": topic, "subtopic": subtopic, "sender": "assistant"}).to_list(length=20)
  
  for chat in previous_chat:
    try:
      data = json.loads(chat["message"])
      previous_examples.extend(data.get("examples", []))
    except json.JSONDecodeError:
      continue
  
  prompt = exampleGenerationPrompt(
    student_name=user["name"],
    education_level=profile.get("education_level", "General") if profile else "General",
    topic=topic,
    subtopic=subtopic,
    previous_examples=previous_examples,
    preferred_language=profile.get("preferred_language", "English") if profile else "English",
    example_query=example_request["example_query"]
  )

  examples = example_generation(prompt)

  progress = await progress_tracking(user["_id"], topic, subtopic, db)

  easy_accuracy = (progress["easy_correct"] / max(progress["questions_attempted"], 1)) * 100
  medium_accuracy = (progress["medium_correct"] / max(progress["questions_attempted"], 1)) * 100
  hard_accuracy = (progress["hard_correct"] / max(progress["questions_attempted"], 1)) * 100
  
  progress["example_requests"] += 1
  
  mastery = calculate_mastery_score(
    accuracy=progress.get("accuracy", 0.0),
    easy_accuracy=easy_accuracy,
    medium_accuracy=medium_accuracy,
    hard_accuracy=hard_accuracy,
    questions_attempted=progress.get("questions_attempted", 0),
    learning_time_seconds=progress.get("learning_time", 0.0),
    example_requests=progress.get("example_requests"),
    solution_explanations_requested=progress.get("solution_explanation_requests", 0)
  )

  await db["chat_history"].insert_one({
    "session_id": session_id,
    "user_id": user["_id"],
    "sender": "user",
    "topic": topic,
    "subtopic": subtopic,
    "message": example_request["example_query"],
    "timestamp": datetime.now()
  })

  msg_to_store = {
    "answer": "",
    "examples": [example.example for example in examples.examples]
  }
  
  await db["chat_history"].insert_one({
    "user_id": user["_id"],
    "session_id": session_id,
    "sender": "assistant",
    "topic": topic,
    "subtopic": subtopic,
    "message": msg_to_store,
    "timestamp": datetime.now()
  })

  await db["learning_progress"].update_one(
    {"_id": progress["_id"]},
    {"$set": {
      "example_requests": progress["example_requests"],
      "mastery_score": mastery,
      "updated_at": datetime.now()
    }}
  )
  
  return {
    "success": True,
    "message": "Examples generated successfully.",
    "data": examples.examples
  }

# =====================================================
# LEARNING ROADMAP
# =====================================================

async def get_roadmap(topic: str, user: dict[str, Any], db):
  profile = await db["profiles"].find_one({"user_id": user["_id"]})
  progress_docs = await db["learning_progress"].find({"user_id": user["_id"], "topic": topic}).to_list(length=None)

  weak_subtopics = []
  strong_subtopics = []
  highest_mastery = 0.0
  all_masteries = []
  total_questions_attempted = 0
  total_hard_attempted = 0

  for doc in progress_docs:
    subtopic = doc.get("subtopic", "Unknown")
    mastery_score = doc.get("mastery_score", 0.0)
    status = doc.get("status", "Beginner")
    questions_attempted = doc.get("questions_attempted", 0)
    hard_attempted = doc.get("hard_attempted", 0)

    all_masteries.append(mastery_score)
    total_questions_attempted += questions_attempted
    total_hard_attempted += hard_attempted
    highest_mastery = max(highest_mastery, mastery_score)

    if mastery_score < 61 or status in ["Beginner", "Learning"]:
      weak_subtopics.append(subtopic)
    elif mastery_score >= 81 and status == "Mastered":
      strong_subtopics.append(subtopic)
  
  overall_mastery = round(sum(all_masteries) / max(len(all_masteries), 1), 2)
  overall_status = get_status(overall_mastery, total_questions_attempted, total_hard_attempted)

  prompt = learningRoadmapPrompt(
    student_name=user["name"],
    education_level=profile.get("education_level", "General") if profile else "General",
    topic=topic,
    mastery_score=highest_mastery,
    weak_subtopics=weak_subtopics,
    strong_subtopics=strong_subtopics,
    current_status=overall_status
  )

  roadmap = generate_learning_roadmap(prompt)

  await db["roadmaps"].update_one(
    {"user_id": user["_id"], "topic": topic},
    {"$set": {
      "roadmap": roadmap.model_dump(mode="json"),
      "updated_at": datetime.now()
    }},
    upsert=True
  )

  return {
    "success": True,
    "message": f"Learning roadmap for topic '{topic}' generated successfully.",
    "data": {
      "topic": topic,
      "roadmap": roadmap.model_dump()
    }
  }
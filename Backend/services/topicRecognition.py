from services.prompts import topicRecognitionPrompt
from services.callAI import recognize_topic

async def recognize_topic_and_subtopic(user_message: str, conversation_history: str, db):
  topics_list = await db["topics"].find({}).to_list(length=None)

  prompt = topicRecognitionPrompt(
    user_message=user_message,
    conversation_history=conversation_history,
    topics_list=topics_list
  )

  ai_response = recognize_topic(prompt)

  if not ai_response.found:
    await db["topics"].insert_one({
      "topic": ai_response.topic,
      "subtopic": ai_response.subtopic
    }) 

  return ai_response.topic, ai_response.subtopic
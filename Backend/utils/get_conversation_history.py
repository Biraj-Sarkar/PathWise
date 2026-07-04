from typing import Any

async def get_conversation_history(user: dict[str, Any], db: any, session_id, limit: int = None) -> str:
  history = await db["chat_history"].find({"session_id": session_id, "user_id": user["_id"]}).sort("timestamp", 1).to_list(length=limit)
  
  conversation_history = ""
  
  for msg in history:
    conversation_history += f"{msg['sender']}: {msg['message']}\n"
  
  return conversation_history
from typing import Any

from services.prompts import opportunityFilterPrompt
from services.callAI import filter_extract

async def opportunity_filter(user: dict[str, Any], profile: dict[str, Any], message: str, db) -> dict[str, Any]:
  education_level = profile.get("education_level", "Not specified")
  career_goal = profile.get("career_goal", "")
  preferred_language = profile.get("preferred_language", "English")
  skills = profile.get("skills", [])

  prompt = opportunityFilterPrompt(education_level, career_goal, preferred_language, skills, message)
  ai_response = filter_extract(prompt)

  filter_criteria = {
    "keywords": ai_response.keywords,
    "opportunity_types": ai_response.opportunity_types,
    "domains": ai_response.domains,
    "locations": ai_response.locations,
    "modes": ai_response.modes
  }

  return {
    "sucess": True,
    "message": "Filter criteria extracted successfully.",
    "data": filter_criteria
  }
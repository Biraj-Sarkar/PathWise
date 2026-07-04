import os
import jwt
import traceback

from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import ValidationError

from models.Profile import StudentProfileCreate, StudentProfileUpdate

from middlewares.authMiddleware import get_user

from utils.get_db import get_db

router = APIRouter(tags=["Profile"])

@router.post("/profile")
async def profile(profile: StudentProfileCreate, user=Depends(get_user), db = Depends(get_db)):
  try:    
    user_id = str(user["_id"])
    
    if await db["profiles"].find_one({"user_id": user_id}):
      raise HTTPException(status_code=400, detail="Profile already exists for this user.")
    
    education_level = profile.education_level
    interests = profile.interests
    skills = profile.skills
    preferred_language = profile.preferred_language
    career_goals = profile.career_goals
    learning_style = profile.learning_style    

    profile_data = {
      "user_id": user_id,
      "education_level": education_level,
      "interests": interests,
      "skills": skills,
      "weak_topics": [],
      "strong_topics": [],
      "preferred_language": preferred_language,
      "career_goals": career_goals,
      "learning_style": learning_style,
      "created_at": datetime.now(),
      "updated_at": datetime.now()
    }

    await db["profiles"].insert_one(profile_data)

    return {
      "success": True,
      "message": "Profile created successfully! 🎉",
      "data": {
        "profile": {
          "education_level": education_level,
          "interests": interests,
          "skills": skills,
          "weak_topics": [],
          "strong_topics": [],
          "preferred_language": preferred_language,
          "career_goals": career_goals,
          "learning_style": learning_style,
          "created_at": profile_data["created_at"],
          "updated_at": profile_data["updated_at"]
        }
      }
    }
  except (ValidationError, ValueError) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile")
async def get_profile(user=Depends(get_user), db = Depends(get_db)):
  try:    
    user_id = str(user["_id"])
    
    profile = await db["profiles"].find_one({"user_id": user_id})

    if not profile:
      raise HTTPException(status_code=404, detail="Profile not found for this user.")

    return {
      "success": True,
      "message": "Profile retrieved successfully! 📄",
      "data": {
        "profile": {
          "education_level": profile.get("education_level"),
          "interests": profile.get("interests", []),
          "skills": profile.get("skills", []),
          "weak_topics": profile.get("weak_topics", []),
          "strong_topics": profile.get("strong_topics", []),
          "preferred_language": profile.get("preferred_language"),
          "career_goals": profile.get("career_goals", []),
          "learning_style": profile.get("learning_style"),
          "created_at": profile["created_at"],
          "updated_at": profile["updated_at"]
        }
      }
    }
  except (ValidationError, ValueError) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
@router.patch("/profile")
async def update_profile(payload: StudentProfileUpdate, user=Depends(get_user), db = Depends(get_db)):
  try:
    user_id = str(user["_id"])
    
    profile = await db["profiles"].find_one({"user_id": user_id})

    if not profile:
      raise HTTPException(status_code=404, detail="Profile not found for this user.")
    
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now()

    await db["profiles"].update_one({"user_id": user_id}, {"$set": update_data})

    return {
      "success": True,
      "message": "Profile updated successfully! ✅",
      "data": {
        "profile": {
          "education_level": profile.get("education_level"),
          "interests": profile.get("interests", []),
          "skills": profile.get("skills", []),
          "weak_topics": profile.get("weak_topics", []),
          "strong_topics": profile.get("strong_topics", []),
          "preferred_language": profile.get("preferred_language"),
          "career_goals": profile.get("career_goals", []),
          "learning_style": profile.get("learning_style"),
          "created_at": profile["created_at"],
          "updated_at": profile["updated_at"]
        }
      }
    }
  except (ValidationError, ValueError) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
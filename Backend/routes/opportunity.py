import hashlib
import traceback

from datetime import datetime
from typing import Any
from bson import ObjectId
from pydantic import ValidationError
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from models.Opportunity import OpportunityType, SaveOpportunity, FilterOpportunities
from utils.get_db import get_db
from middlewares.authMiddleware import get_user
from services.prompts import opportunityPrompt, opportunitySearchPrompt
from services.callAI import recommend_opportunities, filter_opportunities

router = APIRouter(prefix="/opportunities", tags=["Opportunity"])

# =====================================================
# CACHE OPPORTUNITIES
# =====================================================

async def cache_opportunities(user: dict[str, Any], db):
  profile = await db["profiles"].find_one({"user_id": user["_id"]})

  if not profile:
    print(f"Background caching failed: Profile not found for user {str(user['_id'])}")
    return
  
  learning_progress = await db["learning_progress"].find({"user_id": user["_id"]}).to_list(length=None)
  overall_mastery_score = 0.0

  if learning_progress:
    overall_mastery_score = sum(lp.get("mastery_score", 0.0) for lp in learning_progress) / len(learning_progress)
  
  prompt = opportunityPrompt(
    student_name=user["name"],
    education_level=profile.get("education_level", "Not specified"),
    career_goals=profile.get("career_goals", ""),
    preferred_domain=profile.get("preferred_domain", None),
    preferred_location=profile.get("preferred_location", None),
    preferred_language=profile.get("preferred_language", "English"),
    interests=profile.get("interests", []),
    skills=profile.get("skills", []),
    strong_topics=profile.get("strong_topics", []),
    weak_topics=profile.get("weak_topics", []),
    overall_mastery_score=round(overall_mastery_score, 2)
  )

  response = recommend_opportunities(prompt)

  for opportunity in response.opportunities:
    fingerprint = hashlib.sha256(f"{opportunity.title.lower().strip()}|{opportunity.organization.lower().strip()}|{opportunity.apply_link.strip()}|{opportunity.deadline}".encode()).hexdigest()

    opportunity_exists = await db["opportunities"].find_one({"fingerprint": fingerprint})

    if not opportunity_exists:
      await db["opportunities"].insert_one({
        "fingerprint": fingerprint,
        **opportunity.model_dump(mode="json")
      })
  
  payload = {
    "career_guidance": response.career_guidance.model_dump(mode="json"),
    "internships": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Internship"],
    "jobs": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Job"],
    "courses": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Course"],
    "certifications": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Certification"],
    "hackathons": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Hackathon"],
    "competitions": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Competition"],
    "scholarships": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Scholarship"],
    "bootcamps": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Bootcamp"],
    "workshops": [opp.model_dump(mode="json") for opp in response.opportunities if opp.type == "Workshop"]
  }

  await db["user_cached_opportunities"].update_one(
    {"user_id": user["_id"]},
    {"$set": {"recommendations": payload, "updated_at": datetime.now()}},
    upsert=True)

  return {
    "success": True,
    "message": "Opportunities fetched successfully",
    "data": payload
  }

# =====================================================
# REFRESH OPPORTUNITIES
# =====================================================

@router.post("/refresh")
async def refresh_opportunities(background_tasks: BackgroundTasks, user=Depends(get_user), db=Depends(get_db)):
  try:
    background_tasks.add_task(cache_opportunities, user, db)
    return {
      "success": True,
      "message": "Opportunities refresh initiated. Please check back later for updated recommendations."
    }
  except ValueError as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# GET CACHED OPPORTUNITIES
# =====================================================

@router.get("/cached")
async def get_cached_opportunities(user=Depends(get_user), db=Depends(get_db)):
  try:
    cached_opportunities = await db["user_cached_opportunities"].find_one({"user_id": user["_id"]})

    if not cached_opportunities:
      return {
        "success": True,
        "message": "No cached opportunities found",
        "data": {
          "career_guidance": {},
          "internships": [],
          "jobs": [],
          "courses": [],
          "certifications": [],
          "hackathons": [],
          "competitions": [],
          "scholarships": [],
          "bootcamps": [],
          "workshops": []
        }
      }
    
    return {
      "success": True,
      "message": "Cached opportunities fetched successfully",
      "data": cached_opportunities["recommendations"]
    }
  except ValueError as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

# =====================================================
# GET OPPORTUNITIES BY TYPE
# =====================================================

@router.post("/search")
async def search_opportunities(request: FilterOpportunities, user=Depends(get_user), db=Depends(get_db)):
  try:
    profile = await db["profiles"].find_one({"user_id": user["_id"]})

    if not profile:
      raise HTTPException(status_code=404, detail="Profile not found")

    prompt = opportunitySearchPrompt(
      student_name=user["name"],
      education_level=profile.get("education_level", "Not specified"),
      career_goals=profile.get("career_goals", ""),
      preferred_language=profile.get("preferred_language", "English"),
      keywords=request.keywords,
      domains=request.domains,
      opportunity_types=request.types,
      locations=request.locations,
      modes=request.modes,
      skills=profile.get("skills", []),
    )

    results = filter_opportunities(prompt)

    for r in results.results:
      fingerprint = hashlib.sha256(f"{r.title.lower().strip()}|{r.organization.lower().strip()}|{r.apply_link.strip()}|{r.deadline}".encode()).hexdigest()

      opportunity_exists = await db["opportunities"].find_one({"fingerprint": fingerprint})

      if not opportunity_exists:
        await db["opportunities"].insert_one({
          "fingerprint": fingerprint,
          **r.model_dump(mode="json")
        })
    
    await db["user_cached_opportunities"].update_one(
      {"user_id": user["_id"]},
      {"$set": {"recommendations": {
        "career_guidance": {},
        "internships": [r.model_dump(mode="json") for r in results.results if r.type == "Internship"],
        "jobs": [r.model_dump(mode="json") for r in results.results if r.type == "Job"],
        "courses": [r.model_dump(mode="json") for r in results.results if r.type == "Course"],
        "certifications": [r.model_dump(mode="json") for r in results.results if r.type == "Certification"],
        "hackathons": [r.model_dump(mode="json") for r in results.results if r.type == "Hackathon"],
        "competitions": [r.model_dump(mode="json") for r in results.results if r.type == "Competition"],
        "scholarships": [r.model_dump(mode="json") for r in results.results if r.type == "Scholarship"],
        "bootcamps": [r.model_dump(mode="json") for r in results.results if r.type == "Bootcamp"],
        "workshops": [r.model_dump(mode="json") for r in results.results if r.type == "Workshop"]
      }, "updated_at": datetime.now()}},
      upsert=True)

    return {
      "success": True,
      "message": "Search completed successfully",
      "data": results.results
    }
  except (ValidationError, ValueError) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
# =====================================================
# SAVE OPPORTUNITY
# =====================================================

@router.post("/save")
async def save_opportunity(save_request: SaveOpportunity, user=Depends(get_user), db=Depends(get_db)):
  try:
    existing = await db["saved_opportunities"].find_one({
      "user_id": user["_id"],
      "opportunity_id": ObjectId(save_request.opportunity_id)
    })

    if existing:
      raise HTTPException(status_code=400, detail="Opportunity already saved")
    
    await db["saved_opportunities"].insert_one({
      "user_id": user["_id"],
      "opportunity_id": ObjectId(save_request.opportunity_id),
      "saved_at": datetime.now()
    })

    return {
      "success": True,
      "message": "Opportunity saved successfully"
    }
  except (ValidationError, ValueError) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=500, detail=str(e))
  
# =====================================================
# DELETE SAVED OPPORTUNITY
# =====================================================

@router.delete("/save/{opportunity_id}")
async def delete_saved_opportunity(opportunity_id: str, user=Depends(get_user), db=Depends(get_db)):
  try:
    result = await db["saved_opportunities"].delete_one({
      "user_id": user["_id"],
      "opportunity_id": ObjectId(opportunity_id)
    })

    if result.deleted_count == 0:
      raise HTTPException(status_code=404, detail="Saved opportunity not found")

    return {
      "success": True,
      "message": "Saved opportunity deleted successfully"
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# GET SAVED OPPORTUNITIES
# =====================================================

@router.get("/saved")
async def get_saved_opportunities(user=Depends(get_user), db=Depends(get_db)):
  try:
    saved_opportunities = await db["saved_opportunities"].find({"user_id": user["_id"]}).sort("saved_at", -1).to_list(length=None)
    data = saved_opportunities.copy()
    for i in range(len(data)):
      data[i].pop("_id", None)
      data[i].pop("user_id", None)

    return {
      "success": True,
      "message": "Saved opportunities fetched successfully",
      "count": len(data),
      "data": data
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# GET OPPORTUNITY
# =====================================================

@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str, user=Depends(get_user), db=Depends(get_db)):
  try:
    user_id = str(user["_id"])

    opportunity = await db["opportunities"].find_one({"_id": ObjectId(opportunity_id)})

    if not opportunity:
      raise HTTPException(status_code=404, detail="Opportunity not found")

    return {
      "success": True,
      "message": "Opportunity fetched successfully",
      "data": opportunity
    }
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=500, detail=str(e))


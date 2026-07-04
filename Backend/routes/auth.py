import os
import jwt
import bcrypt
import traceback

from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Request, Response, Cookie, Depends
from pydantic import ValidationError
from bson import ObjectId

from models.Auth import UserCreate, LoginRequest, UserUpdate
from utils.get_jwt import getJWTSecret
from utils.get_db import get_db
from middlewares.authMiddleware import get_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
  return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

@router.post("/register")
async def register(user: UserCreate, response: Response, db = Depends(get_db)):
  try:
    jwt_secret, refresh_secret = getJWTSecret()
    name, email, password = user.name, user.email, user.password

    user_exists = await db["users"].find_one({"email": email})
    if user_exists:
      raise HTTPException(status_code=409, detail="User with this email already exists.")
    
    hashed_password = hash_password(password=password)
    user_data = {
      "name": name, 
      "email": email, 
      "password": hashed_password, 
      "avatar": None, 
      "created_at": datetime.now(), 
      "updated_at": datetime.now(),
      "last_login": datetime.now(),
      "streak": 1
    }
    result = await db["users"].insert_one(user_data)

    token = jwt.encode({
      "user_id": str(result.inserted_id),
      "type": "access",
      "exp": int((datetime.now() + timedelta(hours=1)).timestamp())
    }, jwt_secret, algorithm="HS256")

    refresh_token = jwt.encode({
      "user_id": str(result.inserted_id),
      "type": "refresh",
      "exp": int((datetime.now() + timedelta(days=7)).timestamp())
    }, refresh_secret, algorithm="HS256")

    is_production = os.getenv("ENVIRONMENT") == "production"
    response.set_cookie(
      key="refresh_token",
      value=refresh_token,
      httponly=True,
      secure=is_production,
      samesite="lax",
      max_age=7 * 24 * 60 * 60
    )

    return {
      "success": True,
      "message": "User registered successfully! 🎉",
      "data": {
        "token": token,
        "user": {
          "id": str(result.inserted_id),
          "name": name,
          "email": email,
          "avatar": user_data["avatar"],
          "created_at": user_data["created_at"],
          "updated_at": user_data["updated_at"],
          "streak": user_data["streak"]
        }
      }
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
@router.post("/login")
async def login(credentials: LoginRequest, response: Response, db = Depends(get_db)):
  try:
    jwt_secret, refresh_secret = getJWTSecret()
    email, password = credentials.email, credentials.password

    user = await db["users"].find_one({"email": email})

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
      raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = jwt.encode({
      "user_id": str(user["_id"]),
      "type": "access",
      "exp": int((datetime.now() + timedelta(hours=1)).timestamp())
    }, jwt_secret, algorithm="HS256")

    refresh_token = jwt.encode({
      "user_id": str(user["_id"]),
      "type": "refresh",
      "exp": int((datetime.now() + timedelta(days=7)).timestamp())
    }, refresh_secret, algorithm="HS256")

    is_production = os.getenv("ENVIRONMENT") == "production"
    response.set_cookie(
      key="refresh_token",
      value=refresh_token,
      httponly=True,
      secure=is_production,
      samesite="none" if is_production else "lax",
      max_age=7 * 24 * 60 * 60
    )

    last_login_time = datetime.now()
    streak = user.get("streak", 0)

    if user.get("last_login").day == last_login_time.day - 1:
      streak += 1
    elif user.get("last_login").day < last_login_time.day - 1:
      streak = 1
    
    await db["users"].update_one({"_id": ObjectId(user["_id"])}, {"$set": {"last_login": last_login_time, "streak": streak}})

    return {
      "success": True,
      "message": "User logged in successfully! 🎉",
      "data": {
        "token": token,
        "user": {
          "id": str(user["_id"]),
          "name": user["name"],
          "email": user["email"],
          "avatar": user["avatar"],
          "created_at": user["created_at"],
          "updated_at": user["updated_at"],
          "streak": streak
        }
      }
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
@router.post("/logout")
async def logout(response: Response):
  response.delete_cookie(key="refresh_token")
  return {
    "success": True,
    "message": "User logged out successfully! 👋"
  }

@router.post("/refresh")
async def refresh(response: Response, refresh_token: str = Cookie(None, alias="refresh_token"), db = Depends(get_db)):
  try:
    jwt_secret, refresh_secret = getJWTSecret()

    if not refresh_token:
      raise HTTPException(status_code=401, detail="Refresh token is missing.")
    
    decoded = None
    try:
      decoded = jwt.decode(refresh_token, refresh_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
      raise HTTPException(status_code=401, detail="Refresh token has expired.")
    except jwt.InvalidTokenError:
      raise HTTPException(status_code=401, detail="Invalid refresh token.")
    
    if decoded["type"] != "refresh":
      raise HTTPException(status_code=401, detail="Invalid token type.")
    
    user_id = decoded["user_id"]
    user = await db["users"].find_one({"_id": ObjectId(user_id)})

    if not user:
      raise HTTPException(status_code=404, detail="User not found.")
    
    token = jwt.encode({
      "user_id": str(user["_id"]),
      "type": "access",
      "exp": int((datetime.now() + timedelta(hours=1)).timestamp())
    }, jwt_secret, algorithm="HS256")

    refresh_token = jwt.encode({
      "user_id": str(user["_id"]),
      "type": "refresh",
      "exp": int((datetime.now() + timedelta(days=7)).timestamp())
    }, refresh_secret, algorithm="HS256")

    is_production = os.getenv("ENVIRONMENT") == "production"
    response.set_cookie(
      key="refresh_token",
      value=refresh_token,
      httponly=True,
      secure=is_production,
      samesite="lax",
      max_age=7 * 24 * 60 * 60
    )

    last_login_time = datetime.now()
    streak = user.get("streak", 0)
    
    if user.get("last_login").day == last_login_time.day - 1:
      streak += 1
    elif user.get("last_login").day < last_login_time.day - 1:
      streak = 1
    
    await db["users"].update_one({"_id": ObjectId(user["_id"])}, {"$set": {"last_login": last_login_time, "streak": streak}})

    return {
      "success": True,
      "message": "Token refreshed successfully! 🔄",
      "data": {
        "token": token,
        "user": {
          "id": str(user["_id"]),
          "name": user["name"],
          "email": user["email"],
          "avatar": user["avatar"],
          "created_at": user["created_at"],
          "updated_at": user["updated_at"],
          "streak": user["streak"]
        }
      }
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))
  
@router.delete("/delete")
async def delete(request: Request, response: Response, db = Depends(get_db)):
  try:
    user = await get_user(request, db)

    data = await request.json()
    password = data.get("password")

    if not password or not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
      raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    await db["chat_history"].delete_many({"user_id": user["_id"]})
    await db["learning_progress"].delete_many({"user_id": user["_id"]})
    await db["profiles"].delete_one({"user_id": user["_id"]})
    await db["quiz_attempts"].delete_many({"user_id": user["_id"]})
    await db["quizzes"].delete_many({"user_id": user["_id"]})
    await db["roadmaps"].delete_many({"user_id": user["_id"]})
    await db["sessions"].delete_many({"user_id": user["_id"]})
    await db["user_cached_opportunities"].delete_many({"user_id": user["_id"]})
    await db["users"].delete_one({"_id": ObjectId(user["_id"])})

    response.delete_cookie(key="refresh_token")

    return {
      "success": True,
      "message": "User account deleted successfully! 🗑️"
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

@router.patch("/update")
async def update(payload: UserUpdate, request: Request, db = Depends(get_db)):
  try:
    user = await get_user(request, db)
    
    update_data = payload.model_dump(exclude_unset=True)
    await db["users"].update_one({"_id": user["_id"]}, {"$set": update_data})
    await db["users"].update_one({"_id": user["_id"]}, {"$set": {"updated_at": datetime.now()}})

    return {
      "success": True,
      "message": "User updated successfully! ✅",
      "data": {
        "user": {
          "id": str(user["_id"]),
          "name": user["name"],
          "email": user["email"],
          "avatar": user["avatar"],
          "created_at": user["created_at"],
          "updated_at": user["updated_at"]
        }
      }
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

@router.patch("/update-password")
async def update_password(request: Request, user=Depends(get_user), db=Depends(get_db)):
  try:
    user_id = str(user["_id"])
    data = await request.json()
    current_password = data.get("oldPassword")
    new_password = data.get("newPassword")

    if not current_password or not new_password:
      raise HTTPException(status_code=400, detail="Current and new passwords are required.")
    
    if not bcrypt.checkpw(current_password.encode('utf-8'), user["password"].encode('utf-8')):
      raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    hashed_new_password = hash_password(new_password)
    await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": {"password": hashed_new_password, "updated_at": datetime.now()}})

    return {
      "success": True,
      "message": "Password updated successfully! ✅"
    }
  except (ValidationError, Exception) as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    raise HTTPException(status_code=400, detail=str(e))

import os
import jwt

from fastapi import Request, HTTPException, Depends
from bson import ObjectId

from utils.get_jwt import getJWTSecret
from utils.get_db import get_db

async def get_user(request: Request, db=Depends(get_db)):
  jwt_secret, _ = getJWTSecret()
  token = request.headers.get("Authorization")

  if not token or not token.startswith("Bearer "):
    raise HTTPException(status_code=401, detail="Authorization token is missing or invalid.")
    
  decoded = None
  try:
    decoded = jwt.decode(token.split(" ")[1], jwt_secret, algorithms=["HS256"])
  except jwt.ExpiredSignatureError:
    raise HTTPException(status_code=401, detail="Access token has expired.")
  except jwt.InvalidTokenError:
    raise HTTPException(status_code=401, detail="Invalid access token.")
  
  if decoded["type"] != "access":
    raise HTTPException(status_code=401, detail="Invalid token type.")
  
  user_id = decoded["user_id"]
  user = await db["users"].find_one({"_id": ObjectId(user_id)})

  if not user:
    raise HTTPException(status_code=404, detail="User not found.")
  
  return user
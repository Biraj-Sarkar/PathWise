import os
import sys
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

async def connect_db(app: FastAPI):  
  MONGODB_URI = os.getenv("MONGODB_URI")

  if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in the environment variables")

  try:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client["AI_Educator"]
    app.state.db = db

    # Users
    await db["users"].create_index("email", unique=True)

    # Profiles
    await db["profiles"].create_index("user_id", unique=True)

    # Topics
    await db["topics"].create_index([
      ("topic", 1),
      ("subtopic", 1)
    ], unique=True)

    # Learning Progress
    await db["learning_progress"].create_index([
      ("user_id", 1),
      ("topic", 1),
      ("subtopic", 1)
    ], unique=True)

    # Quiz Attempts
    await db["quiz_attempts"].create_index([
      ("user_id", 1),
      ("quiz_id", 1)
    ], unique=True)

    # Opportunities
    await db["opportunities"].create_index("fingerprint", unique=True)

    # Saved Opportunities
    await db["saved_opportunities"].create_index([
      ("user_id", 1),
      ("opportunity_id", 1)
    ], unique=True)

    print("Connected to MongoDB successfully! ✅")
  except (ConnectionFailure, ConfigurationError) as e:
    print(f"Error connecting to MongoDB: {e} ❌")
    sys.exit(1)
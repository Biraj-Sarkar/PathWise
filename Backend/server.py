import os
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

from configs.db import connect_db

from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.learning import router as learning_router
from routes.quiz import router as quiz_router
from routes.opportunity import router as opportunity_router
from routes.playground import router as playground_router

@asynccontextmanager
async def lifespan(app: FastAPI):
  await connect_db(app=app)
  yield

app = FastAPI(lifespan=lifespan)
port = int(os.getenv("PORT", 4000))
client_origin = os.getenv("CLIENT_ORIGIN", "http://localhost:5173")

app.add_middleware(
  CORSMiddleware,
  allow_origins=[client_origin],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)

@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
  try:
    response = await call_next(request)
    return response
  except Exception as e:
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    return JSONResponse(
      status_code=500,
      content={
        "success": False,
        "message": "Internal Server Error", 
        "error": str(e)
      }
    )

@app.get("/")
async def root():
  return {
    "success": True,
    "message": "Welcome to the PathWise AI API! 🚀",
    "data": { "version": "1.0.0" }
  }

app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(learning_router, prefix="/api")
app.include_router(quiz_router, prefix="/api")
app.include_router(opportunity_router, prefix="/api")
app.include_router(playground_router, prefix="/api")

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
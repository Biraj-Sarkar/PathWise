from fastapi import HTTPException, Request

def get_db(request: Request):
  if not hasattr(request.app.state, "db"):
    raise HTTPException(status_code=500, detail="Database connection is not initialized.")
  return request.app.state.db
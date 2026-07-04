import os

def getJWTSecret():
  jwt_secret = os.getenv("JWT_SECRET", "access_secret_key")
  refresh_secret = os.getenv("JWT_REFRESH_SECRET", "refresh_secret_key")

  if not jwt_secret or not refresh_secret:
    raise ValueError("JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.")
  
  return jwt_secret, refresh_secret
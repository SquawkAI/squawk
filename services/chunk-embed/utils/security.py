import os
from dotenv import load_dotenv
from jose import jwt, JWTError

from fastapi import HTTPException, Request

load_dotenv()

ALG = "HS256"
AUD = "embedding"
ISS = "next-api"

def _get_key() -> bytes:
    secret = os.getenv("JWT_SECRET")
    if not secret or not secret.strip():
        # Fail loudly if the service isn't configured
        raise HTTPException(
            status_code=500, detail="Server misconfig: EMBEDDING_JWT_SECRET missing")
    return secret.encode("utf-8")

def get_user_id_from_request(request: Request) -> str:
    auth = request.headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            _get_key(),
            algorithms=[ALG],
            audience=AUD,
            issuer=ISS,
            options={"require_aud": True,
                     "require_iat": True, "require_exp": True},
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=401, detail="Invalid token: missing sub")
    return sub

def assert_file_owned(supabase, file_id: str, user_id: str) -> None:
    # files.project_id -> project.id; enforce project.owner_id = user_id
    res = supabase.table("files").select(
        "id, project!inner(id, owner_id)"
    ).eq("id", str(file_id)).eq("project.owner_id", user_id).execute()

    if not res.data:
        raise HTTPException(
            status_code=404, detail="File not found or unauthorized")
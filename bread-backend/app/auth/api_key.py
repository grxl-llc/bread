from fastapi import Header, HTTPException
import os

API_KEY = os.getenv("BREAD_API_KEY")

async def require_api_key(x_api_key: str = Header(None)):
    """
    Simple header-based API key authentication.
    Clients must send:
    X-API-Key: <key>
    """
    if API_KEY is None:
        raise HTTPException(500, "Server misconfigured: missing API key")

    if x_api_key != API_KEY:
        raise HTTPException(401, "Invalid or missing API key")

    return True

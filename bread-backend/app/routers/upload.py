from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.services.s3 import upload_file_to_s3

router = APIRouter(prefix="/upload", tags=["upload"])

MAX_SIZE = 200 * 1024 * 1024  # 200 MB


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a file to S3. Returns {file_url}.
    Mirrors Base44's integrations.Core.UploadFile interface.
    """
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 200 MB)")

    # Reset so upload service can re-read
    import io
    file.file = io.BytesIO(contents)

    try:
        url = await upload_file_to_s3(file)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="File upload unavailable — S3 not configured. Add AWS credentials to .env to enable uploads."
        )
    return {"file_url": url}

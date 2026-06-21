import boto3
import uuid
import mimetypes
from fastapi import UploadFile
from app.config import settings


def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
    )


async def upload_file_to_s3(file: UploadFile) -> str:
    """Upload a file to S3 and return the public URL."""
    s3 = get_s3_client()

    ext = ""
    if file.filename and "." in file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()

    key = f"uploads/{uuid.uuid4()}{ext}"
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"

    contents = await file.read()

    s3.put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=contents,
        ContentType=content_type,
    )

    if settings.s3_public_base_url:
        return f"{settings.s3_public_base_url.rstrip('/')}/{key}"

    return f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"

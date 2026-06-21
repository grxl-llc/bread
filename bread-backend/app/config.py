from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./bread.db"

    # JWT
    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24 * 30  # 30 days

    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

    # S3
    s3_bucket_name: str = "bread-app-media"
    s3_public_base_url: str = ""  # CloudFront URL or direct S3 URL

    # Amazon IVS
    ivs_region: str = "us-east-1"

    # Kroger API
    kroger_client_id: str = ""
    kroger_client_secret: str = ""

    # Anthropic (Claude)
    anthropic_api_key: str = ""

    # App
    app_env: str = "development"
    allowed_origins: str = "*"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

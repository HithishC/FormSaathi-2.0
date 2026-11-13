"""
Application configuration using pydantic-settings.
Loads environment variables from .env file with sensible defaults.
"""

from typing import List

from cryptography.fernet import Fernet
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "FormSaathi"

    # Database
    DATABASE_URL: str = "sqlite:///./formsaathi.db"

    # Security
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    ALGORITHM: str = "HS256"

    # Sarvam AI
    SARVAM_API_KEY: str = ""
    SARVAM_CHAT_MODEL: str = ""
    SARVAM_STT_MODEL: str = ""
    SARVAM_TTS_MODEL: str = ""

    # DigiLocker (Sandbox)
    DIGILOCKER_CLIENT_ID: str = "sandbox-client-id"
    DIGILOCKER_CLIENT_SECRET: str = "sandbox-client-secret"
    DIGILOCKER_REDIRECT_URI: str = "http://localhost:3000/digilocker/callback"
    DIGILOCKER_AUTH_URL: str = (
        "https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize"
    )
    DIGILOCKER_TOKEN_URL: str = (
        "https://digilocker.meripehchaan.gov.in/public/oauth2/1/token"
    )

    # Encryption
    ENCRYPTION_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # File storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    @property
    def MAX_FILE_SIZE_MB(self) -> int:
        """Backward-compatible name for the upload size limit."""
        return self.MAX_UPLOAD_SIZE_MB

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @model_validator(mode="after")
    def validate_security_keys(self):
        """Refuse startup when persistent production security keys are missing or invalid."""
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must contain at least 32 characters.")

        if not self.ENCRYPTION_KEY:
            raise ValueError("ENCRYPTION_KEY must be configured.")

        try:
            Fernet(self.ENCRYPTION_KEY.encode())
        except Exception as exc:
            raise ValueError("ENCRYPTION_KEY must be a valid Fernet key.") from exc

        return self

    @property
    def encryption_key_bytes(self) -> bytes:
        """Return the persistent configured Fernet key."""
        return self.ENCRYPTION_KEY.encode()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


_settings = None


def get_settings() -> Settings:
    """Return cached settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

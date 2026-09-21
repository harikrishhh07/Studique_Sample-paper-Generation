import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Studique Question Bank & Sample Paper Generator"
    API_V1_STR: str = ""
    
    # DB
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://studique:studique_secure_password@localhost:5432/studique_qb"
    )
    
    # Proxy Authentication
    PROXY_SHARED_SECRET: str = os.getenv("PROXY_SHARED_SECRET", "studique_internal_proxy_secret_2026")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    # Quota & Limits
    DAILY_USER_QUOTA: int = int(os.getenv("DAILY_USER_QUOTA", "10"))
    LLM_TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "120.0"))

    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "anthropic") # 'anthropic' | 'ollama' | 'openai'
    MODEL_NAME: str = os.getenv("MODEL_NAME", "claude-sonnet-5")
    
    # Anthropic
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Ollama / OpenAI Compatible
    OLLAMA_API_KEY: str = os.getenv("OLLAMA_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "https://ollama.com")
    
    # Optional Math OCR
    ENABLE_MATHPIX: bool = os.getenv("ENABLE_MATHPIX", "false").lower() == "true"
    MATHPIX_APP_ID: str = os.getenv("MATHPIX_APP_ID", "")
    MATHPIX_APP_KEY: str = os.getenv("MATHPIX_APP_KEY", "")
    
    # Uploads & Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

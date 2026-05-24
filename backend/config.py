from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL',
        'postgresql://localhost/sop_bps'
    )
    
    # API
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "SOP BPS Surabaya"
    
    # Security
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - Update untuk Vercel
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://sop-bps-surabaya.vercel.app",  # ⬅️ TAMBAHKAN
        "https://*.vercel.app"  # Allow semua subdomain Vercel
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Fix PostgreSQL URL format
if settings.DATABASE_URL and settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)
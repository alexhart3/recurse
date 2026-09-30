import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine

# Load backend/.env
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is missing from backend/.env")

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"},
)

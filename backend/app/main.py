from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("select 1"))
        return {"database": "connected"}
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        ) from exc

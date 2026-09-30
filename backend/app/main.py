from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import engine

app = FastAPI()


class ProblemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: str = Field(min_length=1, max_length=2048)
    difficulty: Optional[Literal["Easy", "Medium", "Hard"]] = None
    topics: list[str] = Field(default_factory=list)
    notes: str = ""

    @field_validator("title", "url")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("topics")
    @classmethod
    def clean_topics(cls, topics: list[str]) -> list[str]:
        return list(dict.fromkeys(topic.strip() for topic in topics if topic.strip()))

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


@app.get("/problems")
def list_problems():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    select
                        id,
                        title,
                        url,
                        difficulty,
                        topics,
                        notes,
                        created_at,
                        last_reviewed_at,
                        next_review_date,
                        review_interval_days,
                        review_count
                    from public.problems
                    order by next_review_date asc, created_at desc
                """)
            )
            return [dict(row) for row in result.mappings()]
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not load problems",
        ) from exc


@app.post("/problems", status_code=201)
def create_problem(problem: ProblemCreate):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    insert into public.problems (
                        title,
                        url,
                        difficulty,
                        topics,
                        notes
                    )
                    values (
                        :title,
                        :url,
                        :difficulty,
                        :topics,
                        :notes
                    )
                    returning
                        id,
                        title,
                        url,
                        difficulty,
                        topics,
                        notes,
                        created_at,
                        last_reviewed_at,
                        next_review_date,
                        review_interval_days,
                        review_count
                """),
                problem.model_dump(),
            )
            return dict(result.mappings().one())
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="A problem with this URL already exists.",
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not save problem",
        ) from exc

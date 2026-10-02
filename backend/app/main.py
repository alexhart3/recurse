from typing import Literal, Optional
from uuid import UUID
import math

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


class ReviewCreate(BaseModel):
    rating: Literal["Again", "Hard", "Good", "Easy"]
    solved_on_own: bool
    notes: str = ""

    @field_validator("notes")
    @classmethod
    def strip_notes(cls, value: str) -> str:
        return value.strip()


def calculate_review_interval(
    rating: str,
    current_interval: int,
    review_count: int,
    solved_on_own: bool,
) -> int:
    if not solved_on_own or rating == "Again" or review_count == 0:
        return 1

    multipliers = {"Hard": 1.2, "Good": 2, "Easy": 2.5}
    return math.ceil(current_interval * multipliers[rating])

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


@app.get("/problems/{problem_id}")
def get_problem(problem_id: UUID):
    try:
        with engine.connect() as connection:
            problem_result = connection.execute(
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
                    where id = cast(:problem_id as uuid)
                """),
                {"problem_id": str(problem_id)},
            )
            problem = problem_result.mappings().first()

            if problem is None:
                raise HTTPException(
                    status_code=404,
                    detail="Problem not found",
                )

            reviews_result = connection.execute(
                text("""
                    select
                        id,
                        reviewed_at,
                        rating,
                        solved_on_own,
                        interval_days_after,
                        notes
                    from public.reviews
                    where problem_id = cast(:problem_id as uuid)
                    order by reviewed_at desc
                """),
                {"problem_id": str(problem_id)},
            )

            return {
                **dict(problem),
                "reviews": [dict(review) for review in reviews_result.mappings()],
            }
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not load problem details",
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


@app.post("/problems/{problem_id}/reviews")
def create_review(problem_id: UUID, review: ReviewCreate):
    try:
        with engine.begin() as connection:
            current_result = connection.execute(
                text("""
                    select review_interval_days, review_count
                    from public.problems
                    where id = cast(:problem_id as uuid)
                    for update
                """),
                {"problem_id": str(problem_id)},
            )
            current_problem = current_result.mappings().first()
            if current_problem is None:
                raise HTTPException(status_code=404, detail="Problem not found")

            interval_days = calculate_review_interval(
                review.rating,
                current_problem["review_interval_days"],
                current_problem["review_count"],
                review.solved_on_own,
            )
            connection.execute(
                text("""
                    insert into public.reviews (
                        problem_id, rating, solved_on_own, interval_days_after, notes
                    ) values (
                        cast(:problem_id as uuid), :rating, :solved_on_own,
                        :interval_days_after, :notes
                    )
                """),
                {
                    "problem_id": str(problem_id),
                    "rating": review.rating,
                    "solved_on_own": review.solved_on_own,
                    "interval_days_after": interval_days,
                    "notes": review.notes,
                },
            )
            updated_result = connection.execute(
                text("""
                    update public.problems
                    set last_reviewed_at = now(),
                        next_review_date = current_date + :interval_days,
                        review_interval_days = :interval_days,
                        review_count = review_count + 1
                    where id = cast(:problem_id as uuid)
                    returning
                        id, title, url, difficulty, topics, notes, created_at,
                        last_reviewed_at, next_review_date,
                        review_interval_days, review_count
                """),
                {"problem_id": str(problem_id), "interval_days": interval_days},
            )
            updated_problem = dict(updated_result.mappings().one())

            reviews_result = connection.execute(
                text("""
                    select id, reviewed_at, rating, solved_on_own,
                           interval_days_after, notes
                    from public.reviews
                    where problem_id = cast(:problem_id as uuid)
                    order by reviewed_at desc
                """),
                {"problem_id": str(problem_id)},
            )
            return {
                **updated_problem,
                "reviews": [dict(row) for row in reviews_result.mappings()],
            }
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not save review",
        ) from exc

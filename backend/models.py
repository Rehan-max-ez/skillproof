from datetime import datetime
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    email: str
    password: str

class AssessmentSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    skill: str
    assessment_type: str = "question"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "in_progress"
    overall_score: Optional[float] = None   # NEW



class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int
    skill: str
    question_text: str
    question_type: str = "theory"   # theory | coding | mcq
    language: Optional[str] = None  # python | cpp | java (for coding)
    examples_json: Optional[list] = Field(default=None, sa_column=Column(JSON))
    difficulty: str = "medium"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserResponse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int
    user_id: int
    answer_text: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)


class EvaluationResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    response_id: int = Field(unique=True, index=True)
    rubric_scores: dict = Field(sa_column=Column(JSON))
    final_score: float
    ai_feedback: str
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)

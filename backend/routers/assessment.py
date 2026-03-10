import random
from backend.ai_service import evaluate_answer_with_gemini
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from backend.database import engine
from backend.auth import get_current_user
from backend.models import AssessmentSession
from datetime import datetime
from backend.models import AssessmentSession, Question
from backend.models import UserResponse , User, EvaluationResult
from sqlmodel import select
from typing import Optional
from backend.ai_service import evaluate_and_generate_next
from backend.schemas import EvaluateResponseRequest, StartAssessmentRequest, SubmitAnswerRequest




router = APIRouter(prefix="/assessment", tags=["Assessment"])


@router.post("/start")
def start_assessment(data: StartAssessmentRequest, current_user: str = Depends(get_current_user)):
    with Session(engine) as db:

        user = db.exec(
            select(User).where(User.username == current_user)
        ).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if user already has active session
        active_session = db.exec(
            select(AssessmentSession)
            .where(AssessmentSession.user_id == user.id)
            .where(AssessmentSession.status == "in_progress")
        ).first()

        if active_session:
            return {
                "message": "Active assessment already exists",
                "session_id": active_session.id
            }

        new_session = AssessmentSession(
            user_id=user.id,
            skill=data.skill,
            assessment_type="question",
            started_at=datetime.utcnow(),
            status="in_progress"
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        return {
            "message": "Assessment started",
            "session_id": new_session.id
        }



@router.post("/generate-question")
def generate_question(
    session_id: int,
    current_user: str = Depends(get_current_user)
):
    with Session(engine) as db:

        session = db.get(AssessmentSession, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Assessment session not found")

        # Only allow generation if no questions exist (First Question Only)
        existing_questions = db.exec(
            select(Question).where(Question.session_id == session_id)
        ).all()

        if len(existing_questions) > 0:
            raise HTTPException(
                status_code=400,
                detail="First question already generated. Use evaluation flow."
            )

        # Generate first question via Gemini
        try:
            from google import genai
            import os
            import json

            api_key = os.environ.get("GEMINI_API_KEY")
            client = genai.Client(api_key=api_key)

            prompt = f"""
You are an expert technical interviewer.

Generate ONE medium difficulty question for the skill: {session.skill}

Return ONLY valid JSON in this format:

{{
  "question_text": string,
  "question_type": "coding" or "theory",
  "difficulty": "medium"
}}

No explanation.
No markdown.
Only JSON.
"""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            raw = response.text.strip()

            if raw.startswith("```"):
                raw = raw.replace("```json", "").replace("```", "").strip()

            parsed = json.loads(raw)

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        new_question = Question(
            session_id=session_id,
            skill=session.skill,
            question_text=parsed["question_text"],
            question_type=parsed["question_type"],
            difficulty="medium"
        )

        db.add(new_question)
        db.commit()
        db.refresh(new_question)

        return {
            "question_id": new_question.id,
            "question": new_question.question_text,
            "question_type": new_question.question_type,
            "difficulty": new_question.difficulty
        }
    
@router.post("/submit-answer")
def submit_answer(
    data: SubmitAnswerRequest,
    current_user: str = Depends(get_current_user)
):
    with Session(engine) as db:

        question = db.get(Question, data.question_id)

        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        user = db.exec(
            select(User).where(User.username == current_user)
        ).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_response = UserResponse(
            question_id=data.question_id,
            user_id=user.id,
            answer_text=data.answer_text
        )

        db.add(new_response)
        db.commit()
        db.refresh(new_response)

        return {
            "message": "Answer submitted successfully",
            "response_id": new_response.id
        }



@router.post("/evaluate-response")
def evaluate_response(data: EvaluateResponseRequest):
    with Session(engine) as db:

        # Idempotency
        existing = db.exec(
            select(EvaluationResult).where(
                EvaluationResult.response_id == data.response_id
            )
        ).first()

        if existing:
            return {
                "rubric_scores": existing.rubric_scores,
                "final_score": existing.final_score,
                "ai_feedback": existing.ai_feedback,
                "message": "Response already evaluated"
            }

        response = db.get(UserResponse, data.response_id)
        if not response:
            raise HTTPException(status_code=404, detail="Response not found")

        question = db.get(Question, response.question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        session = db.get(AssessmentSession, question.session_id)

        # Count existing questions
        existing_questions = db.exec(
            select(Question).where(Question.session_id == session.id)
        ).all()

        try:
            ai_result = evaluate_and_generate_next(
                question_text=question.question_text,
                answer_text=response.answer_text,
                question_type=question.question_type,
                skill=question.skill,
                previous_difficulty=question.difficulty
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        rubric = ai_result["rubric"]
        feedback = rubric.get("feedback", "")
        rubric_scores = {k: v for k, v in rubric.items() if k != "feedback"}

        # Weight logic
        if question.question_type == "coding":
            weights = {
                "correctness": 0.4,
                "time_complexity": 0.2,
                "edge_cases": 0.2,
                "readability": 0.2
            }
        else:
            weights = {
                "technical_accuracy": 0.4,
                "concept_clarity": 0.3,
                "depth": 0.2,
                "communication": 0.1
            }

        final_score = round(
            sum(rubric_scores.get(k, 0) * weights.get(k, 0) for k in weights),
            2
        )

        evaluation = EvaluationResult(
            response_id=data.response_id,
            rubric_scores=rubric_scores,
            final_score=final_score,
            ai_feedback=feedback
        )

        db.add(evaluation)
        db.commit()

        # If already 3 questions → Complete session
        if len(existing_questions) >= 3:

            evaluations = db.exec(
                select(EvaluationResult)
                .join(UserResponse, EvaluationResult.response_id == UserResponse.id)
                .join(Question, UserResponse.question_id == Question.id)
                .where(Question.session_id == session.id)
            ).all()

            session_avg = round(
                sum(e.final_score for e in evaluations) / len(evaluations),
                2
            )

            session.status = "completed"
            session.overall_score = session_avg

            db.add(session)
            db.commit()

            return {
                "rubric_scores": rubric_scores,
                "final_score": final_score,
                "ai_feedback": feedback,
                "session_completed": True,
                "session_average_score": session_avg
            }

        # Otherwise create next question
        next_question = Question(
            session_id=session.id,
            skill=session.skill,
            question_text=ai_result["next_question"],
            question_type=ai_result["next_question_type"],
            difficulty=ai_result["next_difficulty"]
        )

        db.add(next_question)
        db.commit()

        return {
            "rubric_scores": rubric_scores,
            "final_score": final_score,
            "ai_feedback": feedback,
            "session_completed": False,
            "has_next_question": True
        }

@router.get("/next-question")
def get_next_question(session_id: int):
    with Session(engine) as db:

        session = db.get(AssessmentSession, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.status == "completed":
            raise HTTPException(
                status_code=400,
                detail="Assessment already completed"
            )

        questions = db.exec(
            select(Question)
            .where(Question.session_id == session_id)
            .order_by(Question.id.desc())
        ).all()

        if not questions:
            raise HTTPException(status_code=404, detail="No questions found")

        latest_question = questions[0]

        return {
            "question_id": latest_question.id,
            "question": latest_question.question_text,
            "question_type": latest_question.question_type,
            "difficulty": latest_question.difficulty
        }
    
@router.get("/current-question")
def get_current_question(session_id: int):
    with Session(engine) as db:

        session = db.get(AssessmentSession, session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Get latest question in this session
        questions = db.exec(
            select(Question)
            .where(Question.session_id == session_id)
            .order_by(Question.id.desc())
        ).all()

        if not questions:
            raise HTTPException(
                status_code=404,
                detail="No questions generated yet"
            )

        latest_question = questions[0]

        # Check if it already has a response
        response = db.exec(
            select(UserResponse).where(
                UserResponse.question_id == latest_question.id
            )
        ).first()

        if response:
            return {
                "message": "Latest question already answered",
                "question_id": latest_question.id
            }

        return {
            "question_id": latest_question.id,
            "question": latest_question.question_text,
            "question_type": latest_question.question_type,
            "difficulty": latest_question.difficulty
        }




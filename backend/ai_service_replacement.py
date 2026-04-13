import json
import os

from google import genai


MODEL_NAME = "gemini-2.5-flash"
DIFFICULTY_ORDER = ["easy", "medium", "hard"]


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")
    return genai.Client(api_key=api_key)


def _strip_json_fences(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


def _generate_json(prompt: str) -> dict:
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    raw_text = _strip_json_fences(response.text or "")
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse Gemini JSON:\n{raw_text}") from exc

    if not isinstance(parsed, dict):
        raise ValueError(f"Expected JSON object from Gemini, got: {type(parsed).__name__}")

    return parsed


def _rubric_fields(question_type: str) -> list[str]:
    if question_type == "coding":
        return ["correctness", "time_complexity", "edge_cases", "readability"]
    return ["technical_accuracy", "concept_clarity", "depth", "communication"]


def _rubric_schema(question_type: str) -> str:
    if question_type == "coding":
        return """
{
  "correctness": int (0-10),
  "time_complexity": int (0-10),
  "edge_cases": int (0-10),
  "readability": int (0-10),
  "feedback": string
}
"""
    return """
{
  "technical_accuracy": int (0-10),
  "concept_clarity": int (0-10),
  "depth": int (0-10),
  "communication": int (0-10),
  "feedback": string
}
"""


def _normalize_score(value: object, field_name: str) -> int:
    if isinstance(value, bool):
        raise ValueError(f"Invalid rubric score for {field_name}")

    try:
        score = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid rubric score for {field_name}") from exc

    if score < 0 or score > 10:
        raise ValueError(f"Rubric score out of range for {field_name}")
    return score


def _normalize_question_type(value: object) -> str:
    question_type = str(value).strip().lower()
    if question_type not in {"coding", "theory"}:
        raise ValueError("Gemini returned invalid next_question_type")
    return question_type


def normalize_difficulty(value: object) -> str:
    difficulty = str(value).strip().lower()
    if difficulty not in {"easy", "medium", "hard"}:
        raise ValueError("Invalid difficulty value")
    return difficulty


def determine_next_difficulty(previous_difficulty: str, rubric_scores: dict) -> str:
    previous = normalize_difficulty(previous_difficulty)
    numeric_scores = [_normalize_score(score, key) for key, score in rubric_scores.items()]
    average_score = sum(numeric_scores) / len(numeric_scores)

    current_index = DIFFICULTY_ORDER.index(previous)
    if average_score >= 8 and current_index < len(DIFFICULTY_ORDER) - 1:
        return DIFFICULTY_ORDER[current_index + 1]
    if average_score < 5 and current_index > 0:
        return DIFFICULTY_ORDER[current_index - 1]
    return previous


def _validate_rubric(payload: dict, question_type: str) -> dict:
    rubric = payload.get("rubric", payload)
    if not isinstance(rubric, dict):
        raise ValueError("Gemini rubric payload is not a JSON object")

    validated = {}
    for field_name in _rubric_fields(question_type):
        if field_name not in rubric:
            raise ValueError(f"Missing rubric field: {field_name}")
        validated[field_name] = _normalize_score(rubric[field_name], field_name)

    feedback = rubric.get("feedback", "")
    if not isinstance(feedback, str):
        raise ValueError("Rubric feedback must be a string")
    validated["feedback"] = feedback.strip()
    return validated


def evaluate_answer_with_gemini(question_text, answer_text, question_type):
    prompt = f"""
You are a strict technical skill evaluator.

Evaluate the user's answer to the question below.

Question type: {question_type}
Question:
{question_text}

User Answer:
{answer_text}

Return ONLY valid JSON matching this exact schema:
{_rubric_schema(question_type)}

Rules:
- Every numeric score must be an integer from 0 to 10.
- feedback must be concise, specific, and actionable.
- No markdown.
- No explanation outside JSON.
"""

    parsed = _generate_json(prompt)
    return _validate_rubric(parsed, question_type)


def evaluate_and_generate_next(
    question_text,
    answer_text,
    question_type,
    skill,
    previous_difficulty="medium"
):
    previous_difficulty = normalize_difficulty(previous_difficulty)

    prompt = f"""
You are a strict AI interviewer for technical skill assessments.

Task 1:
Evaluate the user's answer using the rubric.

Task 2:
Generate the next follow-up question for the same skill.

Skill: {skill}
Previous difficulty: {previous_difficulty}
Current question type: {question_type}

Question:
{question_text}

User Answer:
{answer_text}

Return ONLY valid JSON in this exact format:
{{
  "rubric": {_rubric_schema(question_type).strip()},
  "next_question": string,
  "next_question_type": "coding" or "theory"
}}

Rules:
- The next question must be one single question only.
- The next question should test the same skill more deeply.
- Do not include markdown or commentary.
- Do not include difficulty in the JSON.
- No explanation outside JSON.
"""

    parsed = _generate_json(prompt)
    rubric = _validate_rubric(parsed, question_type)

    next_question = parsed.get("next_question", "")
    if not isinstance(next_question, str) or not next_question.strip():
        raise ValueError("Gemini returned empty next_question")

    next_question_type = _normalize_question_type(parsed.get("next_question_type"))
    next_difficulty = determine_next_difficulty(
        previous_difficulty,
        {key: value for key, value in rubric.items() if key != "feedback"},
    )

    return {
        "rubric": rubric,
        "next_question": next_question.strip(),
        "next_question_type": next_question_type,
        "next_difficulty": next_difficulty,
    }

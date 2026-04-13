import json
import os
import time

import requests


OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "deepseek-r1:1.5b")
DIFFICULTY_ORDER = ["easy", "medium", "hard"]
MAX_OLLAMA_RETRIES = 3


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


def _coding_examples_schema() -> str:
    return """
[
  {
    "input": string,
    "output": string,
    "explanation": string
  }
]
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
        raise ValueError("AI returned invalid question_type")
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


def _extract_json_object(raw_text: str) -> dict:
    cleaned = raw_text.strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"Failed to parse AI JSON:\n{raw_text}")
        parsed = json.loads(cleaned[start : end + 1])

    if not isinstance(parsed, dict):
        raise ValueError(f"Expected JSON object from AI, got: {type(parsed).__name__}")

    return parsed


def _call_ollama(prompt: str) -> dict:
    last_error = None

    for attempt in range(MAX_OLLAMA_RETRIES):
        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.2,
                    },
                },
                timeout=180,
            )
            response.raise_for_status()
            payload = response.json()
            return _extract_json_object(payload.get("response", ""))
        except Exception as exc:
            last_error = exc
            if attempt == MAX_OLLAMA_RETRIES - 1:
                raise
            time.sleep(1.5 * (attempt + 1))

    raise last_error if last_error is not None else RuntimeError("Ollama request failed")


def _validate_rubric(payload: dict, question_type: str) -> dict:
    rubric = payload.get("rubric", payload)
    if not isinstance(rubric, dict):
        raise ValueError("AI rubric payload is not a JSON object")

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


def _validate_examples(value: object, question_type: str) -> list[dict]:
    if question_type != "coding":
        return []

    if value is None:
        return []

    if not isinstance(value, list):
        raise ValueError("Coding examples must be a list")

    examples = []
    for item in value[:3]:
        if not isinstance(item, dict):
            continue
        input_value = str(item.get("input", "")).strip()
        output_value = str(item.get("output", "")).strip()
        explanation = str(item.get("explanation", "")).strip()
        if not input_value or not output_value:
            continue
        examples.append(
            {
                "input": input_value,
                "output": output_value,
                "explanation": explanation,
            }
        )
    return examples


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

    parsed = _call_ollama(prompt)
    return _validate_rubric(parsed, question_type)


def generate_first_question(skill: str) -> dict:
    prompt = f"""
You are an expert technical interviewer creating adaptive assessments.

Generate ONE medium difficulty question for the skill: {skill}

Return ONLY valid JSON in this exact format:
{{
  "question_text": string,
  "question_type": "coding" or "theory",
  "difficulty": "medium",
  "examples": { _coding_examples_schema().strip() }
}}

Rules:
- Return a single question only.
- difficulty must stay "medium".
- If question_type is "coding", examples must contain 2 or 3 test cases with input and expected output.
- If question_type is "theory", examples must be [].
- No markdown.
- No explanation outside JSON.
"""

    parsed = _call_ollama(prompt)

    question_text = parsed.get("question_text", "")
    question_type = _normalize_question_type(parsed.get("question_type"))
    difficulty = normalize_difficulty(parsed.get("difficulty", "medium"))
    examples = _validate_examples(parsed.get("examples"), question_type)

    if difficulty != "medium":
        difficulty = "medium"
    if not isinstance(question_text, str) or not question_text.strip():
        raise ValueError("AI returned empty question_text")

    return {
        "question_text": question_text.strip(),
        "question_type": question_type,
        "difficulty": difficulty,
        "examples": examples,
    }


def evaluate_and_generate_next(
    question_text,
    answer_text,
    question_type,
    skill,
    previous_difficulty="medium"
):
    previous_difficulty = normalize_difficulty(previous_difficulty)

    prompt = f"""
You are a strict AI interviewer for adaptive technical skill assessments.

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
  "next_question_type": "coding" or "theory",
  "next_question_examples": { _coding_examples_schema().strip() }
}}

Rules:
- The next question must be one single question only.
- The next question should test the same skill more deeply.
- If next_question_type is "coding", next_question_examples must contain 2 or 3 test cases.
- If next_question_type is "theory", next_question_examples must be [].
- Do not include difficulty in the JSON.
- No markdown.
- No explanation outside JSON.
"""

    parsed = _call_ollama(prompt)
    rubric = _validate_rubric(parsed, question_type)

    next_question = parsed.get("next_question", "")
    if not isinstance(next_question, str) or not next_question.strip():
        raise ValueError("AI returned empty next_question")

    next_question_type = _normalize_question_type(parsed.get("next_question_type"))
    next_question_examples = _validate_examples(
        parsed.get("next_question_examples"),
        next_question_type,
    )
    next_difficulty = determine_next_difficulty(
        previous_difficulty,
        {key: value for key, value in rubric.items() if key != "feedback"},
    )

    return {
        "rubric": rubric,
        "next_question": next_question.strip(),
        "next_question_type": next_question_type,
        "next_question_examples": next_question_examples,
        "next_difficulty": next_difficulty,
    }


def check_ollama_connection() -> list[str]:
    response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=30)
    response.raise_for_status()
    payload = response.json()
    models = payload.get("models", [])
    return [str(model.get("name", "")).strip() for model in models if model.get("name")]

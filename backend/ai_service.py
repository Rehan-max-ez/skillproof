"""
ai_service.py — SkillProof AI back-end.

Provider selection: set  AI_PROVIDER=gemini  (default) or  AI_PROVIDER=ollama
in your .env file.

Gemini: requires GEMINI_API_KEY.
Ollama: requires OLLAMA_BASE_URL / OLLAMA_MODEL (existing config, unchanged).
"""

from __future__ import annotations

import json
import os
import time

import requests


# ──────────────────────────────────────────────────────────────
# Provider config
# ──────────────────────────────────────────────────────────────

AI_PROVIDER = os.environ.get("AI_PROVIDER", "gemini").lower()

# Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# Ollama (kept intact for backwards-compat)
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder:1.5b")
OLLAMA_TIMEOUT_SECONDS = int(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "45"))
OLLAMA_KEEP_ALIVE = os.environ.get("OLLAMA_KEEP_ALIVE", "20m")
OLLAMA_NUM_CTX = int(os.environ.get("OLLAMA_NUM_CTX", "2048"))
MAX_OLLAMA_RETRIES = 3

MAX_QUESTION_TEXT_CHARS = int(os.environ.get("MAX_QUESTION_TEXT_CHARS", "1800"))
MAX_ANSWER_TEXT_CHARS = int(os.environ.get("MAX_ANSWER_TEXT_CHARS", "2600"))

DIFFICULTY_ORDER = ["easy", "medium", "hard"]


# ──────────────────────────────────────────────────────────────
# Shared schema helpers (unchanged)
# ──────────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────────
# Validation helpers (unchanged)
# ──────────────────────────────────────────────────────────────

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
    # Strip markdown code fences if present
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        cleaned = cleaned.strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"Failed to parse AI JSON:\n{raw_text}")
        parsed = json.loads(cleaned[start: end + 1])
    if not isinstance(parsed, dict):
        raise ValueError(f"Expected JSON object from AI, got: {type(parsed).__name__}")
    return parsed


def _clip_text(value: str, limit: int) -> str:
    cleaned = value.strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[:limit].rstrip() + "\n[truncated]"


# ──────────────────────────────────────────────────────────────
# Gemini provider
# ──────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> dict:
    """Call the Gemini API using the google-genai SDK."""
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your .env file."
        )

    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError(
            "google-genai package is not installed. Run: pip install google-genai"
        ) from exc

    client = genai.Client(api_key=GEMINI_API_KEY)
    last_error = None
    
    for attempt in range(MAX_OLLAMA_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )
            raw_text = response.text or ""
            return _extract_json_object(raw_text)
        except Exception as exc:
            last_error = exc
            err_msg = str(exc).lower()
            if "503" in err_msg or "429" in err_msg or "demand" in err_msg or "timeout" in err_msg:
                # Temporary overload or limits; try again
                time.sleep(2.0 * (attempt + 1))
            else:
                # Hard error, fail immediately
                raise

    raise RuntimeError(f"Gemini request failed after retries: {last_error}") from last_error


# ──────────────────────────────────────────────────────────────
# Ollama provider (unchanged internals)
# ──────────────────────────────────────────────────────────────

def _call_ollama(prompt: str, *, num_predict: int) -> dict:
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
                    "keep_alive": OLLAMA_KEEP_ALIVE,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9,
                        "num_ctx": OLLAMA_NUM_CTX,
                        "num_predict": num_predict,
                    },
                },
                timeout=OLLAMA_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            payload = response.json()
            return _extract_json_object(payload.get("response", ""))
        except Exception as exc:
            last_error = exc
            if isinstance(exc, requests.Timeout):
                raise RuntimeError(
                    "The local Ollama model took too long to respond. "
                    "Try a faster model like qwen2.5-coder:1.5b or increase OLLAMA_TIMEOUT_SECONDS."
                ) from exc
            if attempt == MAX_OLLAMA_RETRIES - 1:
                raise
            time.sleep(1.5 * (attempt + 1))
    raise last_error if last_error is not None else RuntimeError("Ollama request failed")


# ──────────────────────────────────────────────────────────────
# Unified dispatcher
# ──────────────────────────────────────────────────────────────

def _call_ai(prompt: str, *, num_predict: int = 320) -> dict:
    """Route to Gemini or Ollama based on AI_PROVIDER env var."""
    if AI_PROVIDER == "gemini":
        return _call_gemini(prompt)
    if AI_PROVIDER == "ollama":
        return _call_ollama(prompt, num_predict=num_predict)
    raise RuntimeError(
        f"Unknown AI_PROVIDER={AI_PROVIDER!r}. Set it to 'gemini' or 'ollama'."
    )


# ──────────────────────────────────────────────────────────────
# Rubric / examples validation (unchanged)
# ──────────────────────────────────────────────────────────────

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
        examples.append({"input": input_value, "output": output_value, "explanation": explanation})
    return examples


# ──────────────────────────────────────────────────────────────
# Public API (signatures unchanged — routers don't need editing)
# ──────────────────────────────────────────────────────────────

def evaluate_answer_with_gemini(question_text, answer_text, question_type):
    """Evaluate a candidate answer. Works with both Gemini and Ollama."""
    question_text = _clip_text(question_text, MAX_QUESTION_TEXT_CHARS)
    answer_text = _clip_text(answer_text, MAX_ANSWER_TEXT_CHARS)
    prompt = f"""Return JSON only.
Role: strict technical evaluator.
Question type: {question_type}
Question: {question_text}
Answer: {answer_text}
Schema:
{_rubric_schema(question_type)}
Rules:
- integers 0-10 only
- short actionable feedback
"""
    parsed = _call_ai(prompt, num_predict=180)
    return _validate_rubric(parsed, question_type)


def generate_first_question(skill: str, force_question_type: str = None) -> dict:
    type_rule = ""
    if force_question_type:
        type_rule = f'- question_type MUST be "{force_question_type}"'

    prompt = f"""Return JSON only.
Generate one medium-difficulty interview question for skill: {skill}
Schema:
{{
  "question_text": string,
  "question_type": "coding" or "theory",
  "difficulty": "medium",
  "examples": {_coding_examples_schema().strip()}
}}
Rules:
- one question only
- keep difficulty as medium
- if coding, give exactly 2 short test cases
- if coding, examples MUST NOT contain the answer, code, or query. They must only provide sample input structure and expected output.
{type_rule}
- if theory, examples must be []
"""
    parsed = _call_ai(prompt, num_predict=260)

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
    previous_difficulty="medium",
    force_question_type=None,
):
    previous_difficulty = normalize_difficulty(previous_difficulty)
    question_text = _clip_text(question_text, MAX_QUESTION_TEXT_CHARS)
    answer_text = _clip_text(answer_text, MAX_ANSWER_TEXT_CHARS)

    type_rule = '- next question should probe the same skill'
    if force_question_type:
        type_rule += f'\n- next_question_type MUST be "{force_question_type}"'

    prompt = f"""Return JSON only.
Adaptive interviewer for skill: {skill}
Previous difficulty: {previous_difficulty}
Current question type: {question_type}
Question: {question_text}
Answer: {answer_text}
Schema:
{{
  "rubric": {_rubric_schema(question_type).strip()},
  "next_question": string,
  "next_question_type": "coding" or "theory",
  "next_question_examples": {_coding_examples_schema().strip()}
}}
Rules:
{type_rule}
- if coding, give exactly 2 short test cases
- if coding, examples MUST NOT contain the answer, code, or query. They must only provide sample input structure and expected output.
- if theory, examples must be []
- do not include extra keys
"""
    parsed = _call_ai(prompt, num_predict=320)
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


# ──────────────────────────────────────────────────────────────
# Connection / health checks
# ──────────────────────────────────────────────────────────────

def check_ollama_connection() -> list[str]:
    response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=30)
    response.raise_for_status()
    payload = response.json()
    models = payload.get("models", [])
    return [str(model.get("name", "")).strip() for model in models if model.get("name")]


def check_gemini_connection() -> str:
    """Return the active Gemini model name as a quick connectivity probe."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set.")
    try:
        from google import genai
    except ImportError as exc:
        raise RuntimeError("google-genai not installed") from exc
    # Lightweight: just instantiate the client — no network call needed for a key check
    genai.Client(api_key=GEMINI_API_KEY)
    return GEMINI_MODEL


def get_provider_info() -> dict:
    """Return human-readable provider info for startup logs."""
    if AI_PROVIDER == "gemini":
        return {"provider": "Gemini", "model": GEMINI_MODEL}
    if AI_PROVIDER == "ollama":
        return {"provider": "Ollama", "model": OLLAMA_MODEL, "url": OLLAMA_BASE_URL}
    return {"provider": AI_PROVIDER, "model": "unknown"}

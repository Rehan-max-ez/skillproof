from google import genai
import os
import json


def evaluate_answer_with_gemini(question_text, answer_text, question_type):

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")

    client = genai.Client(api_key=api_key)

    if question_type == "coding":
        rubric_format = """
Return ONLY valid JSON in this format:

{
  "correctness": int (0-10),
  "time_complexity": int (0-10),
  "edge_cases": int (0-10),
  "readability": int (0-10),
  "feedback": string
}
"""
    else:
        rubric_format = """
Return ONLY valid JSON in this format:

{
  "technical_accuracy": int (0-10),
  "concept_clarity": int (0-10),
  "depth": int (0-10),
  "communication": int (0-10),
  "feedback": string
}
"""

    prompt = f"""
You are a strict skill validation evaluator.

Question:
{question_text}

User Answer:
{answer_text}

{rubric_format}

IMPORTANT:
- Return ONLY raw JSON.
- No markdown.
- No explanation.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    raw_text = response.text.strip()

    # 🔥 Clean markdown if Gemini adds ```json
    if raw_text.startswith("```"):
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(raw_text)
        return parsed

    except Exception:
        raise ValueError(f"Failed to parse Gemini JSON:\n{raw_text}")
    
def evaluate_and_generate_next(
    question_text,
    answer_text,
    question_type,
    skill,
    previous_difficulty="medium"
):
    from google import genai
    import os
    import json

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")

    client = genai.Client(api_key=api_key)

    if question_type == "coding":
        rubric_format = """
Rubric format:
{
  "correctness": int (0-10),
  "time_complexity": int (0-10),
  "edge_cases": int (0-10),
  "readability": int (0-10),
  "feedback": string
}
"""
    else:
        rubric_format = """
Rubric format:
{
  "technical_accuracy": int (0-10),
  "concept_clarity": int (0-10),
  "depth": int (0-10),
  "communication": int (0-10),
  "feedback": string
}
"""

    prompt = f"""
You are a strict AI skill evaluator.

1️⃣ Evaluate the user's answer using the rubric.
2️⃣ Then generate a new follow-up question based on performance.
3️⃣ Increase difficulty if score >= 8.
4️⃣ Decrease difficulty if score < 5.
5️⃣ Otherwise keep difficulty same.

Skill: {skill}
Previous Difficulty: {previous_difficulty}

Question:
{question_text}

User Answer:
{answer_text}

Return ONLY valid JSON in this exact format:

{{
  "rubric": <rubric object>,
  "next_question": string,
  "next_question_type": "coding" or "theory",
  "next_difficulty": "easy" or "medium" or "hard"
}}

{rubric_format}

No markdown.
No explanation.
Only JSON.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    raw_text = response.text.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(raw_text)
        return parsed
    except Exception:
        raise ValueError(f"Failed to parse Gemini JSON:\n{raw_text}")
from pathlib import Path
import os

from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parent


def masked(value: str | None, visible: int = 6) -> str:
    if not value:
        return "missing"
    if len(value) <= visible:
        return value
    return f"{value[:visible]}..."


def main() -> None:
    load_dotenv(ROOT / ".env", override=True)

    print("== SkillProof local smoke test ==")
    print("Project root:", ROOT)
    print("Backend folder exists:", (ROOT / "backend").exists())
    print("README exists:", (ROOT / "README.md").exists())
    print("requirements exists:", (ROOT / "requirements.txt").exists())

    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    jwt_secret = os.environ.get("JWT_SECRET")

    print("GEMINI_API_KEY:", masked(gemini_api_key))
    print("JWT_SECRET:", masked(jwt_secret))

    try:
        from backend.database import DATABASE_URL

        print("DATABASE_URL:", DATABASE_URL)
    except Exception as exc:
        print("DATABASE_URL import error:", exc)

    try:
        from backend.main import app

        print("FastAPI app loaded:", app.title or "SkillProof app")
    except Exception as exc:
        print("backend.main import error:", exc)

    if gemini_api_key:
        try:
            from google import genai

            client = genai.Client(api_key=gemini_api_key)
            models = client.models.list()
            first_model = next(iter(models), None)
            print(
                "Gemini connection:",
                "ok" if first_model else "ok (no model names returned)",
            )
            if first_model is not None:
                print("First model:", getattr(first_model, "name", "unknown"))
        except Exception as exc:
            print("Gemini connection error:", exc)
    else:
        print("Gemini connection skipped: missing GEMINI_API_KEY")


if __name__ == "__main__":
    main()


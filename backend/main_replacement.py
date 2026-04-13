import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI

from backend.ai_service import _get_client, _without_proxy_env
from backend.auth import get_current_user
from backend.database import create_db_and_tables
from backend.routers import assessment, user


load_dotenv()

app = FastAPI()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def read_root():
    return {"message": "SkillProof Backend Running"}


app.include_router(user.router)
app.include_router(assessment.router)


@app.get("/test-auth")
def test_auth(u: str = Depends(get_current_user)):
    return {"u": u}


@app.on_event("startup")
def test_gemini_connection():
    print("==== GEMINI STARTUP TEST ====")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY NOT FOUND")
        print("=============================")
        return

    print("API KEY DETECTED:", api_key[:15], "...")

    try:
        client = _get_client()
        with _without_proxy_env():
            models = client.models.list()

        print("GEMINI MODELS AVAILABLE:")
        for model in models:
            print(" -", model.name)

        print("==== GEMINI READY ====")
    except Exception as exc:
        # Startup connectivity should be informative, not fatal.
        print("GEMINI CONNECTION FAILED:", exc)

    print("=============================")

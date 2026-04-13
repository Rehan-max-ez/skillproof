import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.ai_service import (
    AI_PROVIDER,
    OLLAMA_MODEL,
    OLLAMA_TIMEOUT_SECONDS,
    check_gemini_connection,
    check_ollama_connection,
    get_provider_info,
)
from backend.auth import get_current_user
from backend.database import create_db_and_tables
from backend.routers import assessment, user


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
def test_ai_connection():
    info = get_provider_info()
    print("==== AI PROVIDER STARTUP TEST ====")
    print(f"PROVIDER : {info['provider']}")
    print(f"MODEL    : {info['model']}")

    if AI_PROVIDER == "gemini":
        try:
            model = check_gemini_connection()
            print(f"GEMINI READY — model: {model}")
        except Exception as exc:
            print(f"GEMINI CONNECTION FAILED: {exc}")

    elif AI_PROVIDER == "ollama":
        print(f"TIMEOUT  : {OLLAMA_TIMEOUT_SECONDS} seconds")
        try:
            models = check_ollama_connection()
            print("OLLAMA MODELS AVAILABLE:")
            for m in models:
                print(f"  - {m}")
            if OLLAMA_MODEL not in models:
                print("WARNING: target model is not currently pulled.")
            else:
                print("==== OLLAMA READY ====")
        except Exception as exc:
            print(f"OLLAMA CONNECTION FAILED: {exc}")

    else:
        print(f"WARNING: unknown AI_PROVIDER={AI_PROVIDER!r}")

    print("==================================")

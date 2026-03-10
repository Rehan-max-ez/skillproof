from fastapi import Depends, FastAPI
from google import genai
import os
from backend.auth import get_current_user
from backend.database import create_db_and_tables
from backend.models import User
from backend.routers import user
from backend.routers import assessment

from dotenv import load_dotenv
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

from google import genai
import os


@app.on_event("startup")
def test_gemini_connection():
    print("==== GEMINI STARTUP TEST ====")

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        print("❌ GEMINI_API_KEY NOT FOUND")
        return

    print("API KEY DETECTED:", api_key[:15], "...")

    try:
        client = genai.Client(api_key=api_key)

        models = client.models.list()

        print("✅ GEMINI MODELS AVAILABLE:")
        for m in models:
            print(" -", m.name)

        print("==== GEMINI READY ====")

    except Exception as e:
        print("❌ GEMINI CONNECTION FAILED:", e)

    print("=============================")
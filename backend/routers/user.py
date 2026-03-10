from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from backend.database import engine
from backend.models import User
from backend.auth import get_current_user
from backend.schemas import UserCreate, UserLogin
from backend.auth import hash_password, verify_password, create_access_token
from fastapi.security import OAuth2PasswordRequestForm
from backend.auth import get_current_user

router = APIRouter()

def get_session():
    with Session(engine) as session: 
        yield session

@router.post("/register")
def register(user: UserCreate, session: Session = Depends(get_session)):
    db_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    session.add(db_user)
    session.commit()
    return {"message": "User registered"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(User.username == form_data.username)
    ).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_me(current_user: str = Depends(get_current_user)):
    return {"logged_in_as": current_user}

@router.get("/me")
def get_me(current_user: str = Depends(get_current_user)):
    return {"logged_in_as": current_user}



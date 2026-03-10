from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer_text: str


class EvaluateResponseRequest(BaseModel):
    response_id: int


class StartAssessmentRequest(BaseModel):
    skill: str
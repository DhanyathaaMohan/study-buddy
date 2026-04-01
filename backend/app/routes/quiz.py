from fastapi import APIRouter
from app.schemas.quiz_schema import QuizRequest, QuizResponse
from app.services.quiz_service import generate_quiz
from app.schemas.quiz_schema import EvaluateRequest, EvaluateResponse
from app.services.quiz_service import evaluate_quiz

router = APIRouter(prefix="/quiz", tags=["Quiz"])

@router.post("/generate", response_model=QuizResponse)
def create_quiz(data: QuizRequest):
    return generate_quiz(data.topic, data.difficulty)

@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate(data: EvaluateRequest):
    return evaluate_quiz(
        data.topic,
        data.difficulty,
        data.questions,
        data.user_answers
    )
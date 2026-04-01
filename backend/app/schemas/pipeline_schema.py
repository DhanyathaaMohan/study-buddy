from pydantic import BaseModel
from app.schemas.tutor_schema import TutorResponse
from app.schemas.quiz_schema import QuizResponse
from app.schemas.recommend_schema import RecommendationResponse
from typing import List
from app.schemas.quiz_schema import QuizQuestion, EvaluateResponse


class CompletePipelineRequest(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestion]
    user_answers: List[str]


class CompletePipelineResponse(BaseModel):
    evaluation: EvaluateResponse
    recommendations: RecommendationResponse

class PipelineRequest(BaseModel):
    topic: str
    level: str
    difficulty: str


class PipelineResponse(BaseModel):
    tutor: TutorResponse
    quiz: QuizResponse
    recommendations: RecommendationResponse
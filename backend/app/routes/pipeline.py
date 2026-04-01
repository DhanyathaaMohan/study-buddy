from fastapi import APIRouter
from app.schemas.pipeline_schema import PipelineRequest, PipelineResponse
from app.services.tutor_service import generate_tutor_response
from app.services.quiz_service import generate_quiz
from app.services.recommend_service import generate_recommendations
from app.schemas.pipeline_schema import CompletePipelineRequest, CompletePipelineResponse
from app.services.quiz_service import evaluate_quiz

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@router.post("/start", response_model=PipelineResponse)
def start_learning_pipeline(data: PipelineRequest):
    tutor_result = generate_tutor_response(data.topic, data.level)
    quiz_result = generate_quiz(data.topic, data.difficulty)

    recommendation_result = generate_recommendations(
        topic=data.topic,
        difficulty=data.difficulty,
        score=5
    )

    return {
        "tutor": tutor_result,
        "quiz": quiz_result,
        "recommendations": recommendation_result
    }

@router.post("/complete", response_model=CompletePipelineResponse)
def complete_learning_pipeline(data: CompletePipelineRequest):

    evaluation = evaluate_quiz(
        topic=data.topic,
        difficulty=data.difficulty,
        questions=data.questions,
        user_answers=data.user_answers
    )

    recommendations = generate_recommendations(
        topic=data.topic,
        difficulty=evaluation["next_difficulty"],
        score=evaluation["score"]
    )

    return {
        "evaluation": evaluation,
        "recommendations": recommendations
    }
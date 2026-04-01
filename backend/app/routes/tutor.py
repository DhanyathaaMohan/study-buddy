from fastapi import APIRouter
from app.schemas.tutor_schema import TutorRequest, TutorResponse
from app.services.tutor_service import generate_tutor_response

router = APIRouter(prefix="/tutor", tags=["Tutor"])

@router.post("/learn", response_model=TutorResponse)
def learn_topic(data: TutorRequest):
    return generate_tutor_response(data.topic, data.level)
from fastapi import APIRouter
from app.schemas.progress_schema import ProgressUpdateRequest, ProgressResponse
from app.services.progress_service import (
    get_recommended_topic,
    update_progress,
    get_user_progress,
)

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.post("/update")
def save_progress(data: ProgressUpdateRequest):
    update_progress(
        user_id=data.user_id,
        topic=data.topic,
        score=data.score,
        difficulty=data.difficulty,
        next_difficulty=data.next_difficulty,
    )
    return {"message": "Progress updated successfully"}


@router.get("/recommend/{user_id}")
def recommend_topic(user_id: str):
    topic = get_recommended_topic(user_id)

    if not topic:
        return {"message": "No history yet"}

    return {
        "recommended_topic": topic,
        "reason": "This topic needs improvement"
    }


@router.get("/{user_id}", response_model=ProgressResponse)
def fetch_progress(user_id: str):
    return get_user_progress(user_id)
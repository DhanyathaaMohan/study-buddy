from fastapi import APIRouter
from app.schemas.recommend_schema import RecommendationRequest, RecommendationResponse
from app.services.recommend_service import generate_recommendations

router = APIRouter(prefix="/recommend", tags=["Recommendation"])

@router.post("/videos", response_model=RecommendationResponse)
def recommend_videos(data: RecommendationRequest):
    return generate_recommendations(
        data.topic,
        data.difficulty,
        data.score
    )
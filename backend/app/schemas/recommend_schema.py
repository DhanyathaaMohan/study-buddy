from pydantic import BaseModel
from typing import List

class RecommendationRequest(BaseModel):
    topic: str
    difficulty: str
    score: int

class Video(BaseModel):
    title: str
    url: str

class RecommendationResponse(BaseModel):
    topic: str
    videos: List[Video]
from pydantic import BaseModel
from typing import List, Optional

class ProgressUpdateRequest(BaseModel):
    user_id: str
    topic: str
    score: int
    difficulty: str
    next_difficulty: str

class TopicProgress(BaseModel):
    topic: str
    scores: List[int]
    current_difficulty: str
    last_score: int
    attempts: int

class ProgressResponse(BaseModel):
    user_id: str
    topics: List[TopicProgress]
    total_topics: int
    total_attempts: int
    average_score: float
    strongest_topic: Optional[str] = None
    weakest_topic: Optional[str] = None
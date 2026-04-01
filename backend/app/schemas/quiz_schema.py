from pydantic import BaseModel
from typing import List

class QuizRequest(BaseModel):
    topic: str
    difficulty: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str

class QuizResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestion]

class EvaluateRequest(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestion]
    user_answers: List[str]

class EvaluateResponse(BaseModel):
    score: int
    feedback: str
    next_difficulty: str
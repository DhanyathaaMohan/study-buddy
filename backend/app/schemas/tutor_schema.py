from pydantic import BaseModel

class TutorRequest(BaseModel):
    topic: str
    level: str

class TutorResponse(BaseModel):
    topic: str
    level: str
    answer: str
    example: str
    check_question: str
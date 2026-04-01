from pydantic import BaseModel

class ChatRequest(BaseModel):
    topic: str
    message: str

class ChatResponse(BaseModel):
    reply: str
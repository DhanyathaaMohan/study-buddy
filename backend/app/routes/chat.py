from fastapi import APIRouter
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.chat_service import chat_with_ai

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
def chat(data: ChatRequest):
    reply = chat_with_ai(data.topic, data.message)
    return {"reply": reply}
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.tutor import router as tutor_router
from app.routes.quiz import router as quiz_router
from app.routes.recommendation import router as rec_router
from app.routes.pipeline import router as pipeline_router
from app.routes.chat import router as chat_router
from app.routes.progress import router as progress_router

app = FastAPI(title="Study Buddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","https://study-buddy-iota-kohl.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tutor_router)
app.include_router(quiz_router)
app.include_router(rec_router)
app.include_router(pipeline_router)
app.include_router(chat_router)
app.include_router(progress_router)

@app.get("/")
def home():
    return {"message": "Study Buddy backend is running 🚀"}
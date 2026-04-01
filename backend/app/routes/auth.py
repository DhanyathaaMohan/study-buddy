from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth_schema import UserSignup, UserLogin
from app.services.auth_service import create_user, authenticate_user, create_access_token
from app.services.auth_bearer import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup")
def signup(user: UserSignup):
    new_user = create_user(user.name, user.email, user.password)

    if not new_user:
        raise HTTPException(status_code=400, detail="User already exists")

    return {
        "message": "User created successfully",
        "user": new_user
    }


@router.post("/login")
def login(user: UserLogin):
    authenticated_user = authenticate_user(user.email, user.password)

    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": authenticated_user["email"],
        "user_id": authenticated_user["id"],
        "name": authenticated_user["name"]
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": authenticated_user
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "message": "Protected route accessed successfully",
        "user": current_user
    }
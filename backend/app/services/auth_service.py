import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

from app.db import users_collection

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Changed from bcrypt to pbkdf2_sha256
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_user(name: str, email: str, password: str):
    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return None

    hashed_pw = hash_password(password)

    user_data = {
        "name": name,
        "email": email,
        "password": hashed_pw
    }

    result = users_collection.insert_one(user_data)
    return {
        "id": str(result.inserted_id),
        "name": name,
        "email": email
    }


def authenticate_user(email: str, password: str):
    user = users_collection.find_one({"email": email})
    if not user:
        return None

    if not verify_password(password, user["password"]):
        return None

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"]
    }


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
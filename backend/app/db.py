import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in .env")

if not DB_NAME:
    raise ValueError("DB_NAME is not set in .env")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
client.admin.command("ping")

db = client[DB_NAME]

users_collection = db["users"]
progress_collection = db["progress"]
chats_collection = db["chats"]
recommendations_collection = db["recommendations"]

print("✅ MongoDB Connected Successfully")
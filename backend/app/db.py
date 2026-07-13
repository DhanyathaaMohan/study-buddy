import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME") or "study_buddy"

client = None
db = None

# Attempt to connect to real MongoDB if MONGO_URI is provided and not a placeholder
if MONGO_URI and not MONGO_URI.startswith("your_"):
    try:
        print(f"Connecting to MongoDB at {MONGO_URI}...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.admin.command("ping")
        db = client[DB_NAME]
        print("[SUCCESS] MongoDB Connected Successfully")
    except Exception as e:
        print(f"[WARNING] Failed to connect to MongoDB: {e}")
        client = None

# Fallback to mongomock if connection failed or wasn't attempted
if db is None:
    print("[WARNING] MongoDB connection not available. Falling back to mongomock (in-memory mock database)...")
    import mongomock
    client = mongomock.MongoClient()
    db = client[DB_NAME]
    print("[SUCCESS] In-Memory Mock MongoDB Initialized Successfully")

users_collection = db["users"]
progress_collection = db["progress"]
chats_collection = db["chats"]
recommendations_collection = db["recommendations"]
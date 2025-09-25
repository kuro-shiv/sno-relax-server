import sys, json, os
from datetime import datetime
from pymongo import MongoClient

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["snoRelaxDB"]
moods_collection = db["moods"]

# Mood categories & keywords
MOOD_KEYWORDS = {
    "happy": ["happy", "good", "joy", "great", "excited", "amazing", "love"],
    "sad": ["sad", "depressed", "down", "unhappy", "cry", "lonely"],
    "angry": ["angry", "mad", "frustrated", "hate", "annoyed"],
    "stressed": ["stressed", "overwhelmed", "pressure", "tired", "burnout"],
    "anxiety": ["anxious", "nervous", "worried", "panic", "afraid", "fear"],
    "emotional": ["emotional", "touchy", "sensitive", "tearful"]
}

def detect_mood(message):
    message_lower = message.lower()
    for mood, keywords in MOOD_KEYWORDS.items():
        for kw in keywords:
            if kw in message_lower:
                return mood
    return "neutral"

# Load chat history
history_file = "./chat_memory.json"
history = []
if os.path.exists(history_file):
    with open(history_file, "r", encoding="utf-8") as f:
        history = json.load(f)

# Insert moods into DB
for conv in history:
    user_msg = conv["user"]
    timestamp = conv.get("timestamp", datetime.now().isoformat())

    # Check if already in DB
    if moods_collection.find_one({"userMessage": user_msg}):
        continue

    mood = detect_mood(user_msg)
    moods_collection.insert_one({
        "userId": conv.get("userId", "guest"),
        "userMessage": user_msg,
        "mood": mood,
        "timestamp": timestamp
    })

print(f"✅ Processed {len(history)} messages, moods saved to DB")

import sys, json, os
from datetime import datetime
import string
import random

history_file = "./chat_memory.json"

# ---------------- Utility Functions ----------------
def load_history():
    if os.path.exists(history_file):
        return json.load(open(history_file, "r", encoding="utf-8"))
    return []

def save_history(history):
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def normalize(text):
    return text.lower().translate(str.maketrans("", "", string.punctuation)).strip()

# ---------------- Knowledge Base ----------------
# Add more phrases and patterns for richer conversation
GREETING_RESPONSES = [
    "Hello! 😊 How's your day going?",
    "Hi there! What's new?",
    "Hey! Nice to chat with you.",
    "Hello! Ready for some fun chat?"
]

FAREWELL_RESPONSES = [
    "Goodbye! Take care!",
    "See you later! 👋",
    "Bye! Stay safe.",
    "Catch you later! Have a good day!"
]

FEELING_RESPONSES = [
    "I'm just a bot, but I'm happy to chat with you!",
    "I feel great talking to you!",
    "I'm good! How about you?",
    "Feeling energetic! Let's talk more."
]

FUN_FACTS = [
    "Did you know honey never spoils? 🍯",
    "Bananas are berries, but strawberries are not! 🍌",
    "Octopuses have three hearts. 🐙",
    "A group of flamingos is called a 'flamboyance'. 🦩"
]

JOKES = [
    "Why did the computer go to the doctor? Because it caught a virus! 😄",
    "Why was the math book sad? Because it had too many problems! 📚",
    "I told my computer I needed a break, and it froze. ❄️"
]

# ---------------- Pattern-based Responses ----------------
def basic_response(user_input):
    if any(word in user_input for word in ["hi", "hello", "hey"]):
        return random.choice(GREETING_RESPONSES)
    if any(word in user_input for word in ["bye", "goodbye", "see you"]):
        return random.choice(FAREWELL_RESPONSES)
    if any(word in user_input for word in ["how are you", "how's it going"]):
        return random.choice(FEELING_RESPONSES)
    if "your name" in user_input:
        return "I'm SnoBot 🌱, your friendly chatbot!"
    if "time" in user_input:
        return f"The current time is {datetime.now().strftime('%H:%M:%S')}"
    if "joke" in user_input:
        return random.choice(JOKES)
    if "fun fact" in user_input:
        return random.choice(FUN_FACTS)
    if "weather" in user_input:
        return "I can't check live weather yet, but I hope it's sunny! ☀️"
    if "food" in user_input:
        return "I love virtual snacks! 😋 What's your favorite food?"
    if "music" in user_input:
        return "Music is life! 🎵 Who's your favorite artist?"
    if "movie" in user_input:
        return "Movies are fun! 🍿 Do you like action or comedy?"
    return None

# ---------------- Main Loop ----------------
history = load_history()
user_input = sys.stdin.readline().strip()
normalized_input = normalize(user_input)

# Retrieve previous response if identical input exists
reply = None
for conv in history[-20:]:  # check last 20 messages for context
    if normalize(conv["user"]) == normalized_input:
        reply = conv["bot"]
        break

# Get basic response
if not reply:
    reply = basic_response(normalized_input)

# Fallback
if not reply:
    # Echo back with small variations
    fallback_phrases = [
        "Tell me more about that.",
        "Interesting! Can you explain?",
        "I'm learning new things every day. 😄",
        "Hmm, that's curious!",
        "Could you elaborate on that?"
    ]
    reply = random.choice(fallback_phrases)

# Save conversation
history.append({
    "user": user_input,
    "bot": reply,
    "timestamp": datetime.now().isoformat()
})
save_history(history)

print(reply)

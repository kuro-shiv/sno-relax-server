import sys, json, os
from datetime import datetime
import string

history_file = "./chat_memory.json"

def load_history():
    if os.path.exists(history_file):
        return json.load(open(history_file, "r", encoding="utf-8"))
    return []

def save_history(history):
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def normalize(text):
    return text.lower().translate(str.maketrans("", "", string.punctuation)).strip()

history = load_history()
user_input = sys.stdin.readline().strip()
normalized_input = normalize(user_input)

# Retrieve previous response
reply = None
for conv in history:
    if normalize(conv["user"]) == normalized_input:
        reply = conv["bot"]
        break

if not reply:
    reply = "I'm still learning. Could you rephrase or ask another way?"

# Store conversation with timestamp
history.append({
    "user": user_input,
    "bot": reply,
    "timestamp": datetime.now().isoformat()
})
save_history(history)

print(reply)

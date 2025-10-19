# train_model.py
import json
import sys
from datetime import datetime
import random
import os

# Paths
DATA_FILE = "./data/training_data.json"  # file with chat intents/FAQ
MODEL_FILE = "./models/chat_model.json"  # "trained" model output

# Load training data
if not os.path.exists(DATA_FILE):
    print("No training data found. Exiting.")
    sys.exit(1)

with open(DATA_FILE, "r", encoding="utf-8") as f:
    training_data = json.load(f)

# Simulate training (pattern-based for now)
trained_model = {}
for item in training_data.get("intents", []):
    for pattern in item.get("patterns", []):
        trained_model[pattern.lower()] = random.choice(item.get("responses", ["Hmm..."]))

# Save "trained model"
os.makedirs(os.path.dirname(MODEL_FILE), exist_ok=True)
with open(MODEL_FILE, "w", encoding="utf-8") as f:
    json.dump(trained_model, f, ensure_ascii=False, indent=2)

print(f"✅ Training completed at {datetime.now().isoformat()}. Model saved to {MODEL_FILE}")

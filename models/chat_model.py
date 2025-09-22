# models/chat_model.py
import random
import json
import pickle
import sys
import numpy as np
from tensorflow.keras.models import load_model
import nltk
from nltk.stem import WordNetLemmatizer

# Initialize lemmatizer
lemmatizer = WordNetLemmatizer()

# ===== Load model and data =====
try:
    model = load_model("chat_model.h5")
    with open("intents.json") as f:
        intents = json.load(f)
    words = pickle.load(open("words.pkl", "rb"))
    classes = pickle.load(open("classes.pkl", "rb"))
except Exception as e:
    print(f"Error loading model or data: {e}")
    sys.exit(1)

# ===== Functions =====
def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence):
    sentence_words = clean_up_sentence(sentence)
    bag = [0] * len(words)
    for s in sentence_words:
        for i, w in enumerate(words):
            if w == s:
                bag[i] = 1
    return np.array(bag)

def predict_class(sentence):
    p = bow(sentence)
    res = model.predict(np.array([p]), verbose=0)[0]
    ERROR_THRESHOLD = 0.25
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return [{"intent": classes[r[0]], "probability": str(r[1])} for r in results]

def get_response(intents_list):
    if not intents_list:
        return "I'm not sure I understand. Can you try rephrasing?"
    tag = intents_list[0]["intent"]
    responses = next((i["responses"] for i in intents["intents"] if i["tag"] == tag), [])
    return random.choice(responses) if responses else "Hmm, I don't know how to respond to that."

# ===== Entry point for Node.js =====
if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print("No message provided")
            sys.exit(1)

        user_input = " ".join(sys.argv[1:])
        intents_list = predict_class(user_input)
        response = get_response(intents_list)
        print(response)  # Node.js captures stdout
    except Exception as e:
        print(f"Error processing message: {e}")
        sys.exit(1)

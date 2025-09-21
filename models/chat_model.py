# models/chat_model.py
import random
import json
import pickle
import sys
import numpy as np
from tensorflow.keras.models import load_model
import nltk
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()

# Load model and data
model = load_model("chat_model.h5")
intents = json.loads(open("intents.json").read())
words = pickle.load(open("words.pkl", "rb"))
classes = pickle.load(open("classes.pkl", "rb"))

# Functions
def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence):
    sentence_words = clean_up_sentence(sentence)
    bag = [0]*len(words)
    for s in sentence_words:
        for i,w in enumerate(words):
            if w == s:
                bag[i] = 1
    return np.array(bag)

def predict_class(sentence):
    p = bow(sentence)
    res = model.predict(np.array([p]))[0]
    ERROR_THRESHOLD = 0.25
    results = [[i,r] for i,r in enumerate(res) if r>ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({"intent": classes[r[0]], "probability": str(r[1])})
    return return_list

def get_response(intents_list):
    if len(intents_list) == 0:
        return "I'm not sure I understand. Can you try rephrasing?"
    tag = intents_list[0]["intent"]
    list_of_responses = [i["responses"] for i in intents["intents"] if i["tag"] == tag][0]
    return random.choice(list_of_responses)

# Entry point for Node.js
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No message provided")
        sys.exit(1)

    user_input = " ".join(sys.argv[1:])
    intents_list = predict_class(user_input)
    response = get_response(intents_list)
    print(response)  # Node.js will capture this stdout

# models/train_model.py
import json
import numpy as np
import nltk
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import SGD
import pickle
import os

# Download necessary NLTK data
nltk.download("punkt")
nltk.download("wordnet")

from nltk.stem import WordNetLemmatizer
lemmatizer = WordNetLemmatizer()

# Load intents file
INTENTS_FILE = os.path.join(os.path.dirname(__file__), "intents.json")
intents = json.loads(open(INTENTS_FILE).read())

# Prepare data
words = []
classes = []
documents = []

for intent in intents["intents"]:
    for pattern in intent["patterns"]:
        tokens = nltk.word_tokenize(pattern)
        words.extend(tokens)
        documents.append((tokens, intent["tag"]))
        if intent["tag"] not in classes:
            classes.append(intent["tag"])

# Lemmatize and clean words
words = [lemmatizer.lemmatize(w.lower()) for w in words if w.isalpha()]
words = sorted(list(set(words)))
classes = sorted(list(set(classes)))

# Create training data
training = []
output_empty = [0] * len(classes)

for doc in documents:
    bag = []
    pattern_words = [lemmatizer.lemmatize(w.lower()) for w in doc[0]]
    for w in words:
        bag.append(1) if w in pattern_words else bag.append(0)

    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1
    training.append([bag, output_row])

training = np.array(training, dtype=object)
train_x = np.array(list(training[:, 0]))
train_y = np.array(list(training[:, 1]))

# Build model
model = Sequential()
model.add(Dense(128, input_shape=(len(train_x[0]),), activation="relu"))
model.add(Dropout(0.5))
model.add(Dense(64, activation="relu"))
model.add(Dropout(0.5))
model.add(Dense(len(train_y[0]), activation="softmax"))

# Compile model
sgd = SGD(learning_rate=0.01, momentum=0.9, nesterov=True)
model.compile(loss="categorical_crossentropy", optimizer=sgd, metrics=["accuracy"])

# Train model
model.fit(train_x, train_y, epochs=200, batch_size=5, verbose=1)

# Save model and related data
MODEL_DIR = os.path.dirname(__file__)
model.save(os.path.join(MODEL_DIR, "chat_model.h5"))
pickle.dump(words, open(os.path.join(MODEL_DIR, "words.pkl"), "wb"))
pickle.dump(classes, open(os.path.join(MODEL_DIR, "classes.pkl"), "wb"))

print("✅ Model trained and saved successfully!")

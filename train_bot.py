
# train_bot.py
# Example: Send prompts to Cohere and Hugging Face APIs for custom responses.
# (Not true model training, but prompt-based inference)

import os
import requests
from dotenv import load_dotenv

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")

def cohere_custom_prompt(prompt):
    url = "https://api.cohere.ai/v1/chat"
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "message": prompt,
        "model": "command-r-plus"
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json().get("text", "[No reply]")
    return f"[Cohere error: {response.status_code}]"

def hf_custom_prompt(prompt):
    url = "https://api-inference.huggingface.co/models/facebook/blenderbot-3B"
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {"inputs": prompt}
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json().get("generated_text", "[No reply]")
    return f"[HF error: {response.status_code}]"

if __name__ == "__main__":
    print("Training bot with custom prompt. Type 'exit' to quit.")
    print("Type 'cohere:' or 'hf:' before your message to select the API.")
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'exit':
            break
        if user_input.startswith('cohere:'):
            prompt = user_input[len('cohere:'):].strip()
            reply = cohere_custom_prompt(prompt)
        elif user_input.startswith('hf:'):
            prompt = user_input[len('hf:'):].strip()
            reply = hf_custom_prompt(prompt)
        else:
            reply = "Please start your message with 'cohere:' or 'hf:'"
        print("Bot:", reply)

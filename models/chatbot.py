# chatbot.py



# Simple hardcoded chatbot (no training, no external APIs)

def get_basic_reply(message):
    msg = message.lower().strip()
    if msg in ["hi", "hello", "hey"]:
        return "Hello! How can I help you today?"
    elif "how are you" in msg:
        return "I'm just a bot, but I'm here to help!"
    elif "help" in msg:
        return "Sure, let me know what you need help with."
    elif "bye" in msg:
        return "Goodbye! Have a great day!"
    elif "your name" in msg:
        return "I'm SnoRelax Bot."
    else:
        return "Sorry, I don't understand. Can you rephrase?"

if __name__ == "__main__":
    print("Chatbot is ready. Type 'exit' to quit.")
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'exit':
            break
        reply = get_basic_reply(user_input)
        print("Bot:", reply)

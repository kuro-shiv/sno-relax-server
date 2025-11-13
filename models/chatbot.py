# chatbot.py
# Super Enhanced Simple Chatbot with emotional, joke, story and basic medical responses

def get_basic_reply(message):
    msg = message.lower().strip()

    # ------------------ GREETINGS ------------------
    greetings = ["hi", "hello", "hey", "helo", "hlo", "heeey", "hii", "yo", "hola"]
    if msg in greetings:
        return "Hello! 👋 How are you doing today?"

    if "good morning" in msg:
        return "Good morning! ☀️ Hope your day starts great!"

    if "good night" in msg:
        return "Good night! 🌙 Take care and sleep well."

    if "how are you" in msg:
        return "I'm doing great! Thanks for asking 😊 How are *you* feeling?"

    if "your name" in msg:
        return "I'm SnoRelax Bot — your friendly chat buddy 🤖"

    if "bye" in msg or "goodbye" in msg:
        return "Goodbye! Take care ❤️ If you need anything, I'm here."

    # ------------------ EMOTIONAL SUPPORT ------------------
    if "sad" in msg or "hurt" in msg or "cry" in msg or "pain" in msg:
        return (
            "I'm really sorry you're feeling this way 💔.\n"
            "If you want to talk about it, I'm here to listen. What happened?"
        )

    if "depressed" in msg or "lonely" in msg:
        return (
            "You’re not alone. I’m here for you ❤️.\n"
            "If you feel comfortable, share what’s on your mind."
        )

    if "breakup" in msg or "broken heart" in msg or "love problem" in msg:
        return (
            "Heartbreaks hurt more than we often admit 💔.\n"
            "You can share your story with me… I’ll listen."
        )

    if "stress" in msg or "anxiety" in msg:
        return (
            "I understand. Stress can be overwhelming 😔.\n"
            "Try taking a slow deep breath… Want to talk about what's causing it?"
        )

    if "i want to share" in msg or "can i tell you something" in msg or "story" in msg:
        return "Of course! I'm listening 👂✨ Please share whatever you want."

    if "listen" in msg:
        return "I’m here and paying attention. Tell me everything."

    # ------------------ JOKES & FUN ------------------
    if "joke" in msg or "funny" in msg:
        jokes = [
            "Why don’t skeletons fight? — Because they don’t have the guts! 😂",
            "Why was the computer cold? — It forgot to close its Windows! 😆",
            "I tried to catch fog yesterday… Mist! 🌫️",
            "Why don't eggs tell jokes? — They'd crack each other up! 🥚🤣"
        ]
        import random
        return random.choice(jokes)

    if "laugh" in msg:
        return "😆😂🤣 Haha! You're fun to talk with."

    # ------------------ BASIC MEDICAL SAFE RESPONSES ------------------
    if "fever" in msg:
        return (
            "A fever usually means your body is fighting something.\n"
            "Try to rest, stay hydrated, and monitor your temperature. 🌡️\n"
            "If it gets worse, please consult a doctor."
        )

    if "headache" in msg:
        return (
            "Headaches can come from stress, dehydration, or screen time.\n"
            "Try drinking water and resting your eyes. 💆‍♂️\n"
            "If it continues, you should consult a doctor."
        )

    if "cold" in msg or "cough" in msg:
        return (
            "Cold and cough are common — rest well and drink warm fluids. 🤧\n"
            "If symptoms worsen or breathing becomes difficult, contact a doctor."
        )

    if "vomit" in msg or "nausea" in msg:
        return (
            "Nausea can be caused by food issues or infections.\n"
            "Try taking small sips of water. 🚰\n"
            "If vomiting continues, you should see a doctor."
        )

    if "medicine" in msg:
        return "I can't recommend specific medicines, but I can give basic health tips. For medication, please consult a medical professional."

    # ------------------ GENERAL HELP ------------------
    if "help" in msg:
        return "Of course! I'm here to help 🤝. Tell me what you need."

    if "what can you do" in msg or "who are you" in msg:
        return (
            "I can chat with you, tell jokes, listen to your feelings, help with basic health tips, "
            "and be your companion when you're bored or sad 😊."
        )

    # ------------------ UNKNOWN/FALLBACK ------------------
    return (
        "I'm not fully trained on that yet 🤖💭,\n"
        "but I'm here with you. Could you explain it differently?"
    )


# Running directly
if __name__ == "__main__":
    import sys
    
    # If stdin is piped, read from stdin and exit (for API calls)
    if not sys.stdin.isatty():
        try:
            message = sys.stdin.read().strip()
            if message:
                reply = get_basic_reply(message)
                print(reply)  # Print ONLY the reply (no labels)
        except EOFError:
            pass
    else:
        # Interactive mode for direct terminal use
        print("Chatbot is ready. Type 'exit' to quit.")
        while True:
            try:
                user_input = input("You: ")
                if user_input.lower() == 'exit':
                    break
                reply = get_basic_reply(user_input)
                print("Bot:", reply)
            except EOFError:
                break

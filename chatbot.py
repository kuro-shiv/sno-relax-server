"""Simple hardcoded chatbot (no training, no external APIs).

This script supports two modes:
- CLI/STDIN mode: if a message is provided via stdin, it will print a single reply to stdout and exit.
- Interactive mode: run without stdin and it will start a small REPL.
"""

import sys


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


def main_interactive():
    print("Chatbot is ready. Type 'exit' to quit.")
    while True:
        try:
            user_input = input("You: ")
        except EOFError:
            break
        if not user_input:
            continue
        if user_input.lower() == 'exit':
            break
        reply = get_basic_reply(user_input)
        print(reply)


def main_stdin():
    data = sys.stdin.read()
    if not data:
        return
    message = data.strip()
    if not message:
        return
    reply = get_basic_reply(message)
    # print only the reply so caller can parse it easily
    print(reply)


if __name__ == "__main__":
    # If there's data piped in, use stdin mode
    if not sys.stdin.isatty():
        main_stdin()
    else:
        main_interactive()

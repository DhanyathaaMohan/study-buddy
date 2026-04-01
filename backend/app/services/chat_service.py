from app.services.llm_service import ask_groq

chat_history = {}

def chat_with_ai(topic: str, message: str):
    if topic not in chat_history:
        chat_history[topic] = []

    chat_history[topic].append({"role": "user", "content": message})

    history_text = ""
    for msg in chat_history[topic]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"

    prompt = f"""
You are a helpful AI tutor.

Topic: {topic}

Conversation so far:
{history_text}

Now answer the latest user question clearly.
"""

    response = ask_groq(prompt)

    chat_history[topic].append({"role": "assistant", "content": response})

    return response
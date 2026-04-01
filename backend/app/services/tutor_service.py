from app.services.llm_service import ask_groq


def generate_tutor_response(topic: str, level: str):
    prompt = f"""
You are an AI study tutor.

Explain the topic "{topic}" for a "{level}" level student.

Give the response in this exact format:

Answer: <clear explanation>
Example: <simple example>
Check Question: <one short question to test understanding>

Keep it simple, educational, and student-friendly.
"""

    result = ask_groq(prompt)

    answer = ""
    example = ""
    check_question = ""

    lines = result.split("\n")
    for line in lines:
        if line.startswith("Answer:"):
            answer = line.replace("Answer:", "").strip()
        elif line.startswith("Example:"):
            example = line.replace("Example:", "").strip()
        elif line.startswith("Check Question:"):
            check_question = line.replace("Check Question:", "").strip()

    if not answer:
        answer = result.strip()
    if not example:
        example = f"A simple example of {topic}."
    if not check_question:
        check_question = f"What did you understand about {topic}?"

    return {
        "topic": topic,
        "level": level,
        "answer": answer,
        "example": example,
        "check_question": check_question
    }
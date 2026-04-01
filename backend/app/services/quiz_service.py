import re
from app.services.llm_service import ask_groq
from app.ai.difficulty_engine import next_difficulty


def generate_quiz(topic: str, difficulty: str):
    prompt = f"""
You are an AI tutor.

Generate 5 multiple choice questions for the topic "{topic}" at "{difficulty}" level.

Return EXACTLY in this format:

Question: <question text>
Options: A) <option one> B) <option two> C) <option three> D) <option four>
Answer: <ONLY A or B or C or D>

Repeat this for 5 questions.
"""

    result = ask_groq(prompt)

    questions = []
    current_q = {}

    lines = result.split("\n")

    for line in lines:
        line = line.strip()

        if line.startswith("Question:"):
            if current_q:
                questions.append(current_q)
                current_q = {}
            current_q["question"] = line.replace("Question:", "").strip()

        elif line.startswith("Options:"):
            options_text = line.replace("Options:", "").strip()

            matches = re.findall(r'([A-D]\)\s.*?)(?=\s+[A-D]\)\s|$)', options_text)
            current_q["options"] = [opt.strip() for opt in matches]

        elif line.startswith("Answer:"):
            answer_text = line.replace("Answer:", "").strip().upper()
            current_q["answer"] = answer_text[0] if answer_text else ""

    if current_q:
        questions.append(current_q)

    return {
        "topic": topic,
        "difficulty": difficulty,
        "questions": questions
    }


def evaluate_quiz(topic: str, difficulty: str, questions: list, user_answers: list):
    correct = 0

    for i, q in enumerate(questions):
        if i < len(user_answers):
            user_answer = user_answers[i].strip().upper()
            correct_answer = q.answer.strip().upper()

            if ")" in correct_answer:
                correct_answer = correct_answer.split(")")[0].strip()

            if user_answer == correct_answer:
                correct += 1

    score = int((correct / len(questions)) * 10) if questions else 0

    if score >= 8:
        feedback = "Excellent! You have a strong understanding."
    elif score >= 5:
        feedback = "Good job! Review a few concepts."
    else:
        feedback = "Needs improvement. Try revising the basics."

    next_level = next_difficulty(difficulty, score)

    return {
        "score": score,
        "feedback": feedback,
        "next_difficulty": next_level
    }
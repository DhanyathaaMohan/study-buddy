import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = None
use_mock = False

if not GROQ_API_KEY or GROQ_API_KEY.startswith("your_"):
    print("[WARNING] GROQ_API_KEY is not configured. Falling back to mock AI responses...")
    use_mock = True
else:
    from groq import Groq
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"[WARNING] Failed to initialize Groq client: {e}. Falling back to mock AI responses...")
        use_mock = True


def ask_groq(prompt: str) -> str:
    if use_mock:
        # A simple response generator for mock mode
        prompt_lower = prompt.lower()
        if "quiz" in prompt_lower or "generate" in prompt_lower:
            return """{
  "questions": [
    {
      "question": "What is the primary function of DNA in living organisms?",
      "options": ["To store genetic information", "To produce energy", "To build cell walls", "To transport oxygen"],
      "answer": "To store genetic information",
      "explanation": "DNA contains the genetic instructions for the development, functioning, growth, and reproduction of all known organisms."
    },
    {
      "question": "Which of the following is a renewable energy source?",
      "options": ["Coal", "Solar power", "Natural gas", "Nuclear power"],
      "answer": "Solar power",
      "explanation": "Solar energy is collected from sunlight, which is an abundant and naturally replenished resource."
    }
  ]
}"""
        elif "recommend" in prompt_lower:
            return """[
  {
    "title": "Introduction to Database Systems",
    "description": "Learn the basics of SQL, schema design, and relational algebra.",
    "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY"
  },
  {
    "title": "How to learn anything fast",
    "description": "Evidence-based study techniques to retain information longer.",
    "url": "https://www.youtube.com/watch?v=f2O6mQ1MEl8"
  }
]"""
        else:
            return (
                "Hello! I am your AI Study Buddy (running in Mock/Offline mode).\n\n"
                "To get live AI tutoring powered by Groq Llama 3.1, please update the "
                "`GROQ_API_KEY` in `backend/.env`.\n\n"
                f"Here is a mock answer for your prompt about \"{prompt.strip()[:60]}...\":\n"
                "• Make sure to review the topic from multiple study materials.\n"
                "• Break down complex topics into smaller, digestible concepts.\n"
                "• Test yourself frequently with practice quizzes to reinforce memory."
            )

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a helpful AI tutor for students."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=500
    )

    return response.choices[0].message.content
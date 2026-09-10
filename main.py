import os
import re
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="Codewise AI Tutor", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    level: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    history: list["HistoryMessage"] = Field(default_factory=list, max_length=20)


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)


class ChatResponse(BaseModel):
    answer: str


SYSTEM_PROMPT = """You are Codewise, a patient and practical coding tutor.
Teach the user's requested coding topic in exactly this structure:

## 1. What it is used for
Give the purpose and the kinds of problems it solves.

## 2. Simple explanation
Use plain language and one relatable analogy. Define jargon immediately.

## 3. Basic implementation
Show a tiny, runnable example in the most relevant language. Explain each important line.

## 4. Why it matters
Explain the practical difference, trade-offs, and when a developer should use it.

## 5. Your implementation challenge
Give one small, specific coding task without showing the solution. Include the expected behavior.

## 6. Check your understanding
Ask 3 genuinely tricky theory questions. Do not answer them yet.

For a new topic, use exactly the six numbered headings above. Always keep those headings visible and in that order.
For a follow-up question, answer it directly and refer to the previous lesson. If the learner asks about a new topic, start the six-part structure again.
Keep the lesson focused, encouraging, and suitable for the requested learner level. Use Markdown.
Never invent library APIs. If the topic is ambiguous, state your assumption briefly and proceed.
Output only the lesson. Never include internal reasoning, chain-of-thought, analysis, or XML tags such as <think>.
"""


def clean_lesson(text: str) -> str:
    """Remove reasoning traces if a reasoning model includes them in its output."""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<think>.*$", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"^(Here(?:'s| is) (?:my|the) (?:thinking|analysis).*?:\s*)", "", text, flags=re.IGNORECASE | re.DOTALL)
    return text.strip()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "codewise"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is missing. Add it to a .env file in the project root.",
        )

    client = Groq(api_key=api_key)
    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            temperature=0.45,
            max_tokens=900,
            reasoning_format="hidden",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *[
                    {"role": item.role, "content": item.content}
                    for item in request.history[-12:]
                ],
                {
                    "role": "user",
                    "content": f"{request.message}\nLearner level: {request.level}",
                },
            ],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {exc}") from exc

    return ChatResponse(answer=clean_lesson(completion.choices[0].message.content or "No lesson returned."))



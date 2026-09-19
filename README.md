# Codewise AI Tutor

Codewise is a focused AI coding tutor for developers who want to understand both the practical use and the reasoning behind a programming concept. Ask about a topic such as Python decorators, REST APIs, or JavaScript promises, choose your experience level, and receive a structured lesson with an example, trade-offs, an implementation challenge, and theory questions.

The application uses a React and Vite frontend, a FastAPI backend, and Groq for model inference. It is intentionally lightweight: there is no database, authentication layer, or server-side conversation store. Conversation history lives in the browser while the current page is open.

## Why use it?

Codewise is designed for active learning rather than one-shot answers. Each new topic is guided through the same six-part lesson format:

1. What it is used for
2. Simple explanation
3. Basic implementation
4. Why it matters
5. Your implementation challenge
6. Check your understanding

This makes the tool useful for learning an unfamiliar API, preparing for an interview, revisiting a concept, or turning a vague coding question into a small practice task. Follow-up questions include the previous messages so the tutor can continue the same thread.

## Screenshots

FastAPI automatically exposes interactive Swagger documentation at `/docs`. It shows the available health and chat endpoints and their HTTP methods.

![Codewise Swagger API documentation](docs/screenshots/Screenshot%202026-09-19%20100258.png)

The initial frontend screen gives the learner example prompts, a free-form question box, and the Codewise tutor branding.

![Codewise empty learning workspace](docs/screenshots/Screenshot%202026-09-19%20100417.png)

After a prompt is submitted, the user's question and the first sections of the Markdown lesson appear in the conversation.

![Codewise generated lesson](docs/screenshots/Screenshot%202026-09-19%20100501.png)

The lesson continues with a runnable implementation example and line-by-line explanation.

![Codewise implementation example](docs/screenshots/Screenshot%202026-09-19%20100514.png)

The conversation ends with the follow-up composer and the learner-level selector, ready for another question or challenge attempt.

![Codewise follow-up composer and level selector](docs/screenshots/Screenshot%202026-09-19%20100522.png)

## How to use it

1. Start the backend and frontend using the instructions below.
2. Open `http://localhost:5173`.
3. Choose a learner level.
4. Type a coding question or select one of the example prompts.
5. Read the lesson, try the implementation challenge, and ask a follow-up question.
6. Use `New chat` to clear the current in-memory conversation and begin another topic.

## Architecture

```text
Browser (React + Vite)
				|
				| POST /api/chat
				| GET  /api/health
				v
FastAPI application (main.py)
				|
				| validates request, adds system instructions,
				| passes recent history and learner level
				v
Groq Chat Completions API
				|
				v
Structured Markdown lesson returned to the browser
```

### Frontend

The frontend is in `frontend/` and is built with React 18, Vite, `react-markdown`, and `lucide-react`. `App.jsx` manages the current prompt, learner level, messages, loading state, errors, and reset behavior. The browser sends at most the recent conversation messages needed by the backend and renders the tutor response as Markdown.

### Backend

`main.py` defines the FastAPI app, CORS policy, Pydantic request models, the tutor system prompt, and the Groq call. The API validates messages to keep prompts bounded, forwards up to the most recent 12 history entries, and limits each generated answer to 900 tokens. Reasoning output is requested in hidden mode and `clean_lesson()` removes any accidental reasoning tags before the answer reaches the UI.

### Storage and security

No database is used. The API key remains on the backend in `GROQ_API_KEY`; the frontend only calls the local API. For production, restrict CORS to the deployed frontend origin, keep `.env` out of version control, and add authentication and rate limiting before exposing the API publicly.

## Model configuration

The default model is:

```text
openai/gpt-oss-20b
```

It is sent to Groq through the Chat Completions API. You can override it without changing code:

```env
GROQ_MODEL=openai/gpt-oss-20b
```

The model receives the Codewise tutor system prompt, recent conversation history, the new question, and the selected learner level. Temperature is set to `0.45` to keep lessons consistent while allowing natural explanations.

## API reference

### `GET /api/health`

Returns a simple service check:

```json
{
	"status": "ok",
	"service": "codewise"
}
```

### `POST /api/chat`

Request body:

```json
{
	"message": "Explain Python decorators",
	"level": "Beginner",
	"history": [
		{ "role": "user", "content": "What is a function wrapper?" },
		{ "role": "assistant", "content": "A wrapper is ..." }
	]
}
```

Rules enforced by the backend:

- `message` is required and must contain 1 to 2,000 characters.
- `level` must be `Beginner`, `Intermediate`, or `Advanced`.
- `history` is optional and accepts up to 20 messages; only the latest 12 are sent to Groq.
- Each history message must use the `user` or `assistant` role and contain 1 to 6,000 characters.

Successful response:

```json
{
	"answer": "## 1. What it is used for\n..."
}
```

The API returns `503` when `GROQ_API_KEY` is missing and `502` when the Groq request fails.

## Requirements

- Python 3.14 or newer
- `uv` for backend dependency management
- Node.js and npm for the frontend
- A Groq API key

## Local setup

### 1. Configure the backend

Create `.env` in the project root:

```env
GROQ_API_KEY=your_groq_api_key
# Optional: change the default model
GROQ_MODEL=openai/gpt-oss-20b
```

Install the locked Python dependencies and start FastAPI:

```powershell
uv sync
uv run uvicorn main:app --reload --port 8000
```

### 2. Start the frontend

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend defaults to `http://localhost:8000` for the API. To point it elsewhere, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Validation

The application was verified locally with:

```powershell
python -m py_compile main.py
Set-Location frontend
npm run build
```

The live checks confirmed `GET /api/health`, a real `POST /api/chat` request, and the browser flow from prompt selection through rendered lesson response.

## Project structure

```text
.
├── main.py                # FastAPI app and Groq integration
├── pyproject.toml         # Python project metadata and dependencies
├── uv.lock                # Locked Python dependency versions
├── README.md              # Project documentation
└── frontend/
		├── index.html         # Vite HTML entry point
		├── package.json       # Frontend scripts and dependencies
		└── src/
				├── App.jsx       # Tutor UI and API interaction
				├── main.jsx      # React entry point
				└── styles.css    # Responsive visual system
```

## Codewise AI Tutor

A focused coding tutor powered by Groq, with a React frontend and FastAPI backend. No database is used.

### Run it

1. Create a `.env` file in this folder:

```env
GROQ_API_KEY=your_groq_api_key
```

2. Install backend dependencies and start the API:

```powershell
uv sync
uv run uvicorn main:app --reload --port 8000
```

3. In another terminal, start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

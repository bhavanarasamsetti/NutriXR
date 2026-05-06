NutriXR
======

NutriXR is a full stack application with:
1. Backend: Node.js chat server running on port 3001
2. Frontend: Vite app running on port 5173

You can run it with a hosted LLM (Groq or OpenAI), a local LLM (Ollama), or in demo mode without any LLM.

Prerequisites
-------------

- Node.js 18 or newer
- npm

Install
-------

```bash
npm install
Environment

Create a .env file in the project root (same folder as package.json).
This file is git ignored, so do not commit it.

Choose only one configuration below. If you mix multiple providers, behavior can be confusing.

Option 1: Groq (hosted)
DIETITIAN_LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
DIETITIAN_REQUIRE_LLM=true
Option 2: Ollama (local)

Start Ollama locally first (default URL is below).

Then set:

DIETITIAN_LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
DIETITIAN_REQUIRE_LLM=true
Option 3: OpenAI (hosted)
DIETITIAN_LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
DIETITIAN_REQUIRE_LLM=true
Option 4: Demo mode (no LLM)
DIETITIAN_DEMO_MODE=true
Run

Open two terminals.

Terminal 1: backend (chat server on :3001)

npm run server

Terminal 2: frontend (Vite on :5173)

npm run dev

Open the URL shown by Vite, usually:
http://localhost:5173

Notes

.env is git ignored. Do not commit secrets.

If you want to share configuration with your team, create a .env.example with placeholder values only.
If ports are busy, close the process using them or update your project port config.
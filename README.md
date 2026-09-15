# travel-agent-js

Next.js app with Vercel-ready API routes for the travel agent.

## Tech stack

- Next.js (App Router)
- Node.js runtime API routes
- OpenAI JS SDK
- Node test runner for tool regression tests

## API endpoints

- `GET /api/health`
- `GET /health`
- `GET /api/tools`
- `GET /api/data`
- `POST /api/chat`

Example:

```bash
curl -X POST http://127.0.0.1:3000/api/chat \
  -H "content-type: application/json" \
  -d '{"question":"How warm is it in Barcelona right now?"}'
```

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

3. Run dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Deploy to Vercel

1. Import repository in Vercel.
2. Set environment variables in Project Settings -> Environment Variables:
- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional)
- `BACKEND_OPENAI_MODEL` (optional override)
3. Deploy.

No custom server is required for Vercel.

## Tests

```bash
npm test
```

## Project layout

- `app/`: Next.js UI + API route handlers
- `src/agent.js`: tool-calling orchestration
- `src/tools.js`: tool catalog and implementations
- `src/data.js`: mock travel dataset
- `src/prompt.js`: system prompt
- `test/`: regression tests

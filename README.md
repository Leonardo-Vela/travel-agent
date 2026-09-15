# travel-agent-js

Standalone JavaScript port of the Python travel-agent workshop backend.

This folder is designed to be copied into a new repository and published.
You get both:

1. one callable function: `runTravelAgent(...)`
2. optional HTTP API server (`/health`, `/api/tools`, `/api/data`, `/api/chat`)

## What was ported

- Tool catalog and mock dataset
- Tool implementations (directory/weather/flights/hotels/activities/cost)
- Agent tool-calling loop with OpenAI Chat Completions
- Complexity-aware concise derivation behavior for multi-constraint questions
- API surface compatible with existing frontend pattern

## Install

```bash
npm install
```

## Environment

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o-mini"
# optional for API server
export PORT=8000
```

## Use as one function

```js
import { runTravelAgent } from "travel-agent-js";

const result = await runTravelAgent({
  question: "What is the latest flight I have to take to get to London if I have to be at the cheapest hotel in London by 2pm?"
});

console.log(result.answer);
console.log(result.trace);
```

## Run API server

```bash
npm run start
```

Endpoints:

- `GET /health`
- `GET /api/tools`
- `GET /api/data`
- `POST /api/chat`

Example request:

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "content-type: application/json" \
  -d '{"question":"How warm is it in Barcelona right now?"}'
```

## Tests

```bash
npm test
```

## Publish as npm package

1. Set a unique package name in `package.json`.
2. Bump version.
3. Login and publish:

```bash
npm login
npm publish --access public
```

## Suggested repo layout

- `src/data.js`: fixed dataset
- `src/tools.js`: tool implementations + catalog
- `src/prompt.js`: model behavior policy
- `src/agent.js`: one-function tool-calling agent
- `src/server.js`: optional API wrapper
- `src/index.js`: package exports
- `test/`: regression tests

## Known differences vs Python runtime

- Uses OpenAI JS SDK directly (not LangGraph stream events).
- Keeps behavior parity for tool outputs and constraints, but trace format is simplified.

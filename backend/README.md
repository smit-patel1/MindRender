# Backend

A lightweight local backend for MindRender built with Node.js and Hono.

## Setup

1. `cd backend`
2. Copy `.env.example` to `.env` and fill in the required environment variables.
3. `npm install`
4. Run in development mode: `npm run dev`
5. Build the project: `npm run build`
6. Start the production server: `npm start`

The server defaults to port **8787**. You can override this with the `PORT` environment variable.

## Environment Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `PERPLEXITY_API_KEY`

## Example Requests

### Generate a Simulation

```bash
curl -X POST http://localhost:8787/simulate \
  -H "Authorization: Bearer <SUPABASE_USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Simulate gravity", "subject":"Physics"}'
```

### Get Token Total

```bash
curl -X GET "http://localhost:8787/get_token_total?user_id=<USER_ID>" \
  -H "Authorization: Bearer <SUPABASE_USER_TOKEN>"
```

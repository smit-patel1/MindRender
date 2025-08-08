import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import app from './server';

config();

const port = Number(process.env.PORT) || 8787;

console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });

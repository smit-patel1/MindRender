import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { simulateHandler } from './routes/simulate';
import { tokenTotalHandler } from './routes/token_total';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
  }),
);

app.post('/simulate', simulateHandler);
app.get('/get_token_total', tokenTotalHandler);

export default app;

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import { API_BASENAME, api, routesReady } from './route-builder';

const app = new Hono();

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred',
        details: serializeError(err),
      },
      500
    );
  }
  return c.json({ error: 'An error occurred' }, 500);
});

// CORS
if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
} else {
  // Allow all origins in development
  app.use('/*', cors());
}

// Body size limit
for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024, // 4.5mb
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

// API routes - wait for routes to be loaded
await routesReady;
app.route(API_BASENAME, api);

export default await createHonoServer({
  app,
  defaultLogger: false,
});

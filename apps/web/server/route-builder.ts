import fg from 'fast-glob';
import { Hono } from 'hono';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const API_BASENAME = '/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const api = new Hono();

// Dynamically load all API routes
async function loadRoutes() {
  const routeFiles = await fg(['**/route.{js,ts}'], {
    cwd: path.join(__dirname, '../src/app/api'),
    absolute: true,
  });

  for (const file of routeFiles) {
    const relativePath = path.relative(path.join(__dirname, '../src/app/api'), file);
    const routePath = '/' + relativePath
      .replace(/\/route\.(js|ts)$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1'); // Convert [param] to :param

    try {
      const module = await import(file);

      if (module.GET) {
        api.get(routePath, async (c) => {
          const request = c.req.raw;
          const response = await module.GET(request);
          return response;
        });
      }

      if (module.POST) {
        api.post(routePath, async (c) => {
          const request = c.req.raw;
          const response = await module.POST(request);
          return response;
        });
      }

      if (module.PUT) {
        api.put(routePath, async (c) => {
          const request = c.req.raw;
          const response = await module.PUT(request);
          return response;
        });
      }

      if (module.DELETE) {
        api.delete(routePath, async (c) => {
          const request = c.req.raw;
          const response = await module.DELETE(request);
          return response;
        });
      }

      if (module.PATCH) {
        api.patch(routePath, async (c) => {
          const request = c.req.raw;
          const response = await module.PATCH(request);
          return response;
        });
      }

      console.log(`Loaded route: ${API_BASENAME}${routePath}`);
    } catch (error) {
      console.error(`Failed to load route ${file}:`, error);
    }
  }
}

// Load routes synchronously before exporting
export const routesReady = loadRoutes().catch(console.error);

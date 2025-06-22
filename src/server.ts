import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Set Cross-Origin headers for all responses
 */
app.use(function (req, res, next) {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        // Check if this is a 404 route
        const url = req.url;
        if (url && !url.startsWith('/api') && !url.includes('.')) {
          // Check for the global HTTP status property set by Angular
          const globalStatus = (global as any).__ANGULAR_HTTP_STATUS__;
          if (globalStatus === 404) {
            res.status(404);
            // Clear the status after using it
            delete (global as any).__ANGULAR_HTTP_STATUS__;
          }
          
          // Also check the response body for 404 indicators
          const responseText = response.body?.toString() || '';
          if (responseText.includes('Page Not Found') || responseText.includes('404')) {
            res.status(404);
          }
        }
        writeResponseToNodeResponse(response, res);
      } else {
        // No response means 404
        res.status(404);
        res.send('Page not found');
      }
    })
    .catch((error) => {
      console.error('Error handling request:', error);
      res.status(500);
      res.send('Internal server error');
    });
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */

// const port = process.env['PORT'] || 4000;
const port = process.env['PORT'];
app.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});


/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

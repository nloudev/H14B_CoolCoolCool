import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: { title: 'CoolCoolCool API', version: '1.0.0' },
  servers: [
    { url: 'https://h14-b-cool-cool-cool.vercel.app', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Local' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, './orders.js'), path.join(__dirname, './health.js')]
};

const swaggerSpec = swaggerJSDoc(options);

router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CoolCoolCool API</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api-docs/spec',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
            deepLinking: true
          })
        </script>
      </body>
    </html>
  `);
});

router.get('/spec', (req, res) => {
  res.json(swaggerSpec);
});

export default router;
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();
const port = process.env.PORT || 3000;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CoolCoolCool API',
    version: '1.0.0',
    description: 'API documentation powered by Swagger',
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Local server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/server.js'],
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (req, res) => {
  res.json({ status: string, uptime: int, timestamp: datetime });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});

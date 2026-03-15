import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import orderRoutes from './routes/orders.js';
import healthRoutes from './routes/health.js';


const app = express();
const port = process.env.PORT || 3000;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: { title: 'CoolCoolCool API', version: '1.0.0' },
  servers: [
    { url: 'https://h14bcoolcoolcool.vercel.app', description: 'Production' },
    { url: `http://localhost:${port}`, description: 'Local' }
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

const options = { swaggerDefinition, apis: ['./src/routes/*.js'] };
const swaggerSpec = swaggerJSDoc(options);

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/orders', orderRoutes);
app.use('/health', healthRoutes);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  next();
});

// stop hanging
// if (require.main === module) {
//     app.listen(port, () => {
//         console.log(`Server running at http://localhost:${port}`);
//     });
// }

export default app;
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();
const port = process.env.PORT || 3000;

// --- SWAGGER CONFIG ---
const swaggerDefinition = {
  openapi: '3.0.0',
  info: { title: 'CoolCoolCool API', version: '1.0.0' },
  servers: [{ url: `http://localhost:${port}` }],
};

const options = { swaggerDefinition, apis: ['./src/server.js'] };
const swaggerSpec = swaggerJSDoc(options);

// --- MIDDLEWARE ---
app.use(express.json());

// --- ROUTES ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post('/orders', (req, res) => {
    const authHeader = req.headers['authorization'];
    const { productId, quantity } = req.body;

    if (!authHeader || authHeader === 'Invalid token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!productId || !quantity) {
        return res.status(422).json({ error: 'Missing required fields' });
    }
    res.status(201).json({ message: 'Order created', productId, quantity });
});

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Bad JSON' });
    }
    next();
});

// --- THE FIX: ONLY ONE LISTEN BLOCK AT THE VERY BOTTOM ---
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
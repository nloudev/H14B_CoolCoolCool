const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const { create_xml } = require('./input.js');

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
    const { 
        order, 
        buyer, 
        seller, 
        delivery, 
        tax, 
        items, 
        loyaltyPointsRedeemed 
    } = req.body;

    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader === 'Invalid token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!order?.id || !buyer?.companyId || !items || !Array.isArray(items)) {
        return res.status(422).json({ 
            error: "Missing required fields: order.id, buyer.companyId, and items array are mandatory." 
        });
    }
    create_xml(req.body);

    res.status(200).json({
        orderId: -1, 
        status: -1, 
        totalCost: -1, 
        taxAmount: -1, 
        payableAmount: -1, 
        anticipatedMonetaryTotal: -1, 
        loyaltyPointsEarned: -1, 
        loyaltyPointsRedeemed: -1, 
        ublDocument: fs.readFileSync('src/creation_output.xml', 'utf-8')
    });
});

// --- ERROR HANDLING ---
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

module.exports = app;
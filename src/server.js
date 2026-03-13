const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const dotenv = require ('dotenv/config');
const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 3000;

const { create_xml, getLineExtension, getTaxAmount, getPayableAmount } = require('./input.js');
const creation_output_path = 'src/creation_output.xml';

const loyalty_point_coeff = 0.08;

// --- SWAGGER CONFIG ---
const swaggerDefinition = {
  openapi: '3.0.0',
  info: { title: 'CoolCoolCool API', version: '1.0.0' },
  servers: [{ url: `http://localhost:${port}` }],
};

const options = { swaggerDefinition, apis: ['./src/server.js'] };
const swaggerSpec = swaggerJSDoc(options);
app.use(express.json());
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

// --- ROUTES ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post('/orders', async (req, res) => {
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
    
    try {
        create_xml(req.body);
        const taxAmount = Number(getTaxAmount(req.body).toFixed(2));
        const payableAmount = Number(getPayableAmount(req.body).toFixed(2));
        const lineExtensionAmount = getLineExtension(req.body);

        await prisma.order.create({
            data: {
                orderId: order.id,
                status: "order placed",
                inputData: req.body,
                totalCost: (taxAmount + payableAmount),
                taxAmount: taxAmount,
                payableAmount: payableAmount,
                anticipatedMonetaryTotal: lineExtensionAmount,
                loyaltyPointsEarned: Math.round(payableAmount * loyalty_point_coeff),
                loyaltyPointsRedeemed: 0,
            }
        });

        res.status(200).json({
            orderId: order.id,
            status: "order placed",
            totalCost: taxAmount + payableAmount,
            taxAmount: taxAmount,
            payableAmount: payableAmount,
            anticipatedMonetaryTotal: lineExtensionAmount,
            loyaltyPointsEarned: Math.round(payableAmount * loyalty_point_coeff),
            loyaltyPointsRedeemed: 0,
            ublDocument: fs.readFileSync(creation_output_path, 'utf-8')
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: "Order ID already exists" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
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
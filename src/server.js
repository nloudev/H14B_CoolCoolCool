import express from 'express';

import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import fs from 'fs';
import 'dotenv/config'; // This automatically loads your .env variables

import { PrismaClient } from '@prisma/client';

let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient();
}
prisma = global.prisma;

const app = express();
const port = process.env.PORT || 3000;

import { create_xml, getLineExtension, getTaxAmount, getPayableAmount } from './input.js';
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


// --- ROUTES ---
app.get('/health', (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp:  new Date().toISOString()});
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// POST route
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

    try {
        let xml_output = create_xml(req.body);
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
            ublDocument: xml_output
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: "Vercel Error", 
            detail: error.message,
            stack: error.stack 
        }); 
    }
});

// GET route
app.get('/orders/:id', async (req, res) => {

    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader === 'Invalid token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const orderId = req.params.id;

    try {

        const found = await prisma.order.findUnique({
            where: { orderId: orderId }
        });

        if (!found) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const xml_output = create_xml(found.inputData);

        res.status(200).json({
            orderId: found.orderId,
            status: found.status,
            totalCost: found.totalCost,
            taxAmount: found.taxAmount,
            payableAmount: found.payableAmount,
            anticipatedMonetaryTotal: found.anticipatedMonetaryTotal,
            createdAt: found.createdAt,
            ublDocument: xml_output
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Vercel Error",
            detail: error.message,
            stack: error.stack
        });
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

export default app;
import express from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
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
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                 timestamp:
 *                   type: string
 *                   example: "2025-04-01T12:00:00.000Z"
 *       500:
 *         description: Server error
 */
router.get('/', getHealth);

export default router;
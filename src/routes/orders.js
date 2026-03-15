import express from 'express';
import { postOrder, getOrder, putOrder, deleteOrder, listOrders } from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place a new order and generate UBL 2.1 XML
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order, buyer, seller, delivery, tax, items]
 *             properties:
 *               order:
 *                 type: object
 *                 properties:
 *                   id: { type: string, example: ORD-2025-001 }
 *                   issueDate: { type: string, example: "2025-04-01" }
 *                   note: { type: string, example: "Leave at front door" }
 *                   currencyID: { type: string, example: AUD }
 *                   orderDocumentReference: { type: string, example: ORD-2025-000 }
 *               buyer:
 *                 type: object
 *                 properties:
 *                   name: { type: string, example: "John Smith" }
 *                   street: { type: string, example: "123 Main Street" }
 *                   city: { type: string, example: "Sydney" }
 *                   postalCode: { type: string, example: "2000" }
 *                   countryCode: { type: string, example: AU }
 *                   companyId: { type: string, example: "123456789" }
 *                   legalEntityId: { type: string, example: "123456789" }
 *                   taxSchemeId: { type: string, example: GST }
 *                   contactName: { type: string, example: "John Smith" }
 *                   contactPhone: { type: string, example: "0400000000" }
 *                   contactEmail: { type: string, example: "john@email.com" }
 *               seller:
 *                 type: object
 *                 properties:
 *                   name: { type: string, example: "Hardware Co Pty Ltd" }
 *                   street: { type: string, example: "456 Trade Street" }
 *                   city: { type: string, example: "Melbourne" }
 *                   postalCode: { type: string, example: "3000" }
 *                   countryCode: { type: string, example: AU }
 *                   companyId: { type: string, example: "987654321" }
 *                   legalEntityId: { type: string, example: "987654321" }
 *                   taxSchemeId: { type: string, example: GST }
 *                   contactName: { type: string, example: "Jane Doe" }
 *                   contactPhone: { type: string, example: "0411111111" }
 *                   contactEmail: { type: string, example: "jane@hardwareco.com" }
 *               delivery:
 *                 type: object
 *                 properties:
 *                   street: { type: string, example: "123 Main Street" }
 *                   city: { type: string, example: "Sydney" }
 *                   postalCode: { type: string, example: "2000" }
 *                   countryCode: { type: string, example: AU }
 *                   requestedStartDate: { type: string, example: "2025-04-05" }
 *                   requestedEndDate: { type: string, example: "2025-04-07" }
 *               tax:
 *                 type: object
 *                 properties:
 *                   taxTypeCode: { type: string, example: GST }
 *                   taxPercent: { type: number, example: 10.0 }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: LINE-1 }
 *                     product:
 *                       type: object
 *                       properties:
 *                         sellersItemId: { type: string, example: PROD-101 }
 *                         name: { type: string, example: "Vacuum Cleaner X200" }
 *                         description: { type: string, example: "Bagless upright vacuum cleaner 2200W" }
 *                     quantity: { type: integer, example: 2 }
 *                     unitCode: { type: string, example: EA }
 *                     priceAmount: { type: number, example: 299.99 }
 *               loyaltyPointsRedeemed: { type: integer, example: 0 }
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId: { type: string }
 *                 status: { type: string }
 *                 totalCost: { type: number }
 *                 taxAmount: { type: number }
 *                 payableAmount: { type: number }
 *                 anticipatedMonetaryTotal: { type: number }
 *                 loyaltyPointsEarned: { type: integer }
 *                 loyaltyPointsRedeemed: { type: integer }
 *                 ublDocument: { type: string }
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Missing required fields
 */
router.post('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  postOrder(req, res);
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Retrieve a stored order and its UBL XML
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId: { type: string }
 *                 status: { type: string }
 *                 totalCost: { type: number }
 *                 taxAmount: { type: number }
 *                 payableAmount: { type: number }
 *                 anticipatedMonetaryTotal: { type: number }
 *                 createdAt: { type: string }
 *                 ublDocument: { type: string }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  getOrder(req, res);
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to delete
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *                 id:
 *                   type: string
 *                 deletedAt:
 *                   type: string
 *       401:
 *         description: Unauthorised
 *       404:
 *         description: Order not found
 */
router.delete('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  deleteOrder(req, res);
});

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all orders with optional filters
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by buyer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   orderId: { type: string }
 *                   status: { type: string }
 *                   totalCost: { type: number }
 *                   createdAt: { type: string }
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  listOrders(req, res);
});

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order fields and regenerate UBL 2.1 XML
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order:
 *                 type: object
 *                 properties:
 *                   issueDate: { type: string, example: "2025-04-01" }
 *                   note: { type: string, example: "Updated note" }
 *                   currencyID: { type: string, example: AUD }
 *                   orderDocumentReference: { type: string, example: ORD-2025-000 }
 *               buyer:
 *                 type: object
 *                 properties:
 *                   name: { type: string, example: "John Smith" }
 *                   street: { type: string, example: "123 Main Street" }
 *                   city: { type: string, example: "Sydney" }
 *                   postalCode: { type: string, example: "2000" }
 *                   countryCode: { type: string, example: AU }
 *                   companyId: { type: string, example: "123456789" }
 *                   legalEntityId: { type: string, example: "123456789" }
 *                   taxSchemeId: { type: string, example: GST }
 *                   contactName: { type: string, example: "John Smith" }
 *                   contactPhone: { type: string, example: "0400000000" }
 *                   contactEmail: { type: string, example: "john@email.com" }
 *               seller:
 *                 type: object
 *                 properties:
 *                   name: { type: string, example: "Hardware Co Pty Ltd" }
 *                   street: { type: string, example: "456 Trade Street" }
 *                   city: { type: string, example: "Melbourne" }
 *                   postalCode: { type: string, example: "3000" }
 *                   countryCode: { type: string, example: AU }
 *                   companyId: { type: string, example: "987654321" }
 *                   legalEntityId: { type: string, example: "987654321" }
 *                   taxSchemeId: { type: string, example: GST }
 *                   contactName: { type: string, example: "Jane Doe" }
 *                   contactPhone: { type: string, example: "0411111111" }
 *                   contactEmail: { type: string, example: "jane@hardwareco.com" }
 *               delivery:
 *                 type: object
 *                 properties:
 *                   street: { type: string, example: "123 Main Street" }
 *                   city: { type: string, example: "Sydney" }
 *                   postalCode: { type: string, example: "2000" }
 *                   countryCode: { type: string, example: AU }
 *                   requestedStartDate: { type: string, example: "2025-04-05" }
 *                   requestedEndDate: { type: string, example: "2025-04-07" }
 *               tax:
 *                 type: object
 *                 properties:
 *                   taxTypeCode: { type: string, example: GST }
 *                   taxPercent: { type: number, example: 10.0 }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: LINE-1 }
 *                     product:
 *                       type: object
 *                       properties:
 *                         sellersItemId: { type: string, example: PROD-101 }
 *                         name: { type: string, example: "Vacuum Cleaner X200" }
 *                         description: { type: string, example: "Bagless upright vacuum cleaner 2200W" }
 *                     quantity: { type: integer, example: 2 }
 *                     unitCode: { type: string, example: EA }
 *                     priceAmount: { type: number, example: 299.99 }
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId: { type: string }
 *                 status: { type: string }
 *                 totalCost: { type: number }
 *                 taxAmount: { type: number }
 *                 payableAmount: { type: number }
 *                 anticipatedMonetaryTotal: { type: number }
 *                 ublDocument: { type: string }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       422:
 *         description: No valid fields provided
 *       500:
 *         description: Server error
 */
router.put('/:id', (req, res, next) => {
  authMiddleware(req, res, next);
}, (req, res) => {
  putOrder(req, res);
});

export default router;
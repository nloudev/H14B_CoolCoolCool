import { jest } from '@jest/globals';
import request from 'supertest';

// Mock Prisma
const mPrisma = {
    order: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
    },
    $disconnect: jest.fn()
};

await jest.unstable_mockModule('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mPrisma)
}));

// Mock input.js
const mockCreateXml = jest.fn();
await jest.unstable_mockModule('../input.js', () => ({
    create_xml: mockCreateXml,
    getLineExtension: jest.fn(),
    getTaxAmount: jest.fn(() => 0),
    getPayableAmount: jest.fn(() => 0),
}));

const { default: app } = await import('../server.js');

// Mock data
const mockOrder = {
    order: { id: "ORDER-123" },
    buyer: { companyId: "BUYER-456" },
    seller: { companyId: "SELLER-789" },
    items: [
        { id: "ITEM-1", quantity: 2, price: 10.50 }
    ]
};

const mockDbOrder = {
    orderId: "ORDER-123",
    status: "order placed",
    totalCost: 0,
    taxAmount: 0,
    payableAmount: 0,
    anticipatedMonetaryTotal: 0,
    inputData: mockOrder,
    createdAt: new Date().toISOString()
};

describe('DELETE /orders/:id', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateXml.mockReturnValue('<xml/>');
    });

    test('should successfully delete an order with valid ID', async () => {
        mPrisma.order.findUnique.mockResolvedValue(mockDbOrder);
        mPrisma.order.delete.mockResolvedValue(mockDbOrder);

        const response = await request(app)
            .delete('/orders/ORDER-123')
            .set('Authorization', 'Valid token');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            message: 'Order deleted successfully',
            id: 'ORDER-123'
        });
        expect(response.body.deletedAt).toBeDefined();
    });

    test('should return 401 for missing Authorization header', async () => {
        const response = await request(app)
            .delete('/orders/ORDER-123');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .delete('/orders/ORDER-123')
            .set('Authorization', 'Invalid token');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized');
    });

    test('should return 404 when order does not exist', async () => {
        mPrisma.order.findUnique.mockResolvedValue(null);

        const response = await request(app)
            .delete('/orders/NONEXISTENT')
            .set('Authorization', 'Valid token');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Order not found');
    });

    test('should return valid ISO timestamp on success', async () => {
        mPrisma.order.findUnique.mockResolvedValue(mockDbOrder);
        mPrisma.order.delete.mockResolvedValue(mockDbOrder);

        const response = await request(app)
            .delete('/orders/ORDER-123')
            .set('Authorization', 'Valid token');

        expect(response.status).toBe(200);
        expect(response.body.deletedAt).toBeDefined;
        const deleteTime = new Date(response.body.deletedAt);
        expect(deleteTime.getTime()).not.toBeNaN();
    });

    test('should return 500 when database throws an error', async () => {
        mPrisma.order.findUnique.mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app)
            .delete('/orders/ORDER-123')
            .set('Authorization', 'Valid token');

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal server error');
    });

    test('should call prisma.order.findUnique and prisma.order.delete with correct ID', async () => {
        mPrisma.order.findUnique.mockResolvedValue(mockDbOrder);
        mPrisma.order.delete.mockResolvedValue(mockDbOrder);

        await request(app)
            .delete('/orders/ORDER-123')
            .set('Authorization', 'Valid token');

        expect(mPrisma.order.findUnique).toHaveBeenCalledWith({ where: { orderId: 'ORDER-123' } });
        expect(mPrisma.order.delete).toHaveBeenCalledWith({ where: { orderId: 'ORDER-123' } });
    });

    test('should NOT call prisma.order.delete when order is not found', async () => {
        mPrisma.order.findUnique.mockResolvedValue(null);

        await request(app)
            .delete('/orders/NONEXISTENT')
            .set('Authorization', 'Valid token');

        expect(mPrisma.order.delete).not.toHaveBeenCalled();
    });

    test('should handle malformed JSON in request body', async () => {
        const response = await request(app)
            .delete('/orders/ORDER-123')
            .set('Authorization', 'Valid token')
            .set('Content-Type', 'application/json')
            .send('{"invalid-json":}');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad JSON');
    });
});

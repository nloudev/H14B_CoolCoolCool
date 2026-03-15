import { jest } from '@jest/globals';

const mPrisma = {
  order: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn()
};

await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mPrisma)
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const { default: app } = await import('../../src/server.js');

let server;
let url;

const mockOrders = [
  {
    orderId: 'ORD-2025-001',
    status: 'order placed',
    totalCost: 755.97,
    createdAt: new Date()
  },
  {
    orderId: 'ORD-2025-002',
    status: 'order placed',
    totalCost: 100.00,
    createdAt: new Date()
  }
];

beforeAll((done) => {
  server = app.listen(0, () => {
    const port = server.address().port;
    url = `http://localhost:${port}`;
    done();
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /orders', () => {

  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/orders`);
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/orders`, {
      headers: { Authorization: 'Invalid token' }
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 200: returns all orders', async () => {
    mPrisma.order.findMany.mockResolvedValue(mockOrders);

    const response = await fetch(`${url}/orders`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      createdAt: expect.any(String)
    });
  });

  test('HTTP 200: returns empty array when no orders', async () => {
    mPrisma.order.findMany.mockResolvedValue([]);

    const response = await fetch(`${url}/orders`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  test('HTTP 200: filters by status', async () => {
    mPrisma.order.findMany.mockResolvedValue([mockOrders[0]]);

    const response = await fetch(`${url}/orders?status=order+placed`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(mPrisma.order.findMany).toHaveBeenCalledWith({
      where: { status: 'order placed' }
    });
    expect(data).toHaveLength(1);
  });

  test('HTTP 200: filters by buyerId', async () => {
    mPrisma.order.findMany.mockResolvedValue([mockOrders[0]]);

    const response = await fetch(`${url}/orders?buyerId=BUYER-123`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    expect(mPrisma.order.findMany).toHaveBeenCalledWith({
      where: { buyerId: 'BUYER-123' }
    });
  });

  test('HTTP 200: filters by both buyerId and status', async () => {
    mPrisma.order.findMany.mockResolvedValue([mockOrders[0]]);

    const response = await fetch(`${url}/orders?buyerId=BUYER-123&status=order+placed`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    expect(mPrisma.order.findMany).toHaveBeenCalledWith({
      where: { buyerId: 'BUYER-123', status: 'order placed' }
    });
  });

  test('HTTP 500: database failure', async () => {
    mPrisma.order.findMany.mockRejectedValue(new Error('Database connection failed'));

    const response = await fetch(`${url}/orders`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toMatchObject({ error: 'Database connection failed' });
  });
});
import { jest } from '@jest/globals';
import fs from 'fs';

const mPrisma = {
  order: {
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn()
};

await jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mPrisma)
}));

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const { default: app } = await import('../../src/server.js');

const creation_input1 = fs.readFileSync('tests/inputs/creation_input_1.json', 'utf-8');

let server;
let url;

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

describe('PUT /orders/:id', () => {

  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Invalid token'
      },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 422: empty body', async () => {
    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(422);
  });

  test('HTTP 404: order not found', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/NONEXISTENT`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Order not found');
  });

  test('HTTP 200: updates order note successfully', async () => {
    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      taxAmount: 63,
      payableAmount: 692.97,
      anticipatedMonetaryTotal: 629.97,
      inputData: JSON.parse(creation_input1)
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      inputData: {
        ...existingOrder.inputData,
        order: { ...existingOrder.inputData.order, note: 'Updated note' }
      }
    });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: expect.any(Number),
      taxAmount: expect.any(Number),
      payableAmount: expect.any(Number),
      anticipatedMonetaryTotal: expect.any(Number),
      ublDocument: expect.any(String)
    });
  });

  test('HTTP 200: updates items successfully and regenerates XML', async () => {
    const existingOrder = {
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      taxAmount: 63,
      payableAmount: 692.97,
      anticipatedMonetaryTotal: 629.97,
      inputData: JSON.parse(creation_input1)
    };

    mPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mPrisma.order.update.mockResolvedValue(existingOrder);

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({
        items: [
          {
            id: 'LINE-1',
            product: {
              sellersItemId: 'PROD-101',
              name: 'Vacuum Cleaner X200',
              description: 'Bagless upright vacuum cleaner 2200W'
            },
            quantity: 5,
            unitCode: 'EA',
            priceAmount: 299.99
          }
        ]
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ublDocument).toContain('<Order');
  });

  test('HTTP 500: database failure on findUnique', async () => {
    mPrisma.order.findUnique.mockRejectedValue(new Error('Database connection failed'));

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: JSON.stringify({ order: { note: 'Updated note' } })
    });

    expect(response.status).toBe(500);
  });

  test('HTTP 400: malformed JSON', async () => {
    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: '{"invalid-json":}'
    });

    expect(response.status).toBe(400);
  });
});
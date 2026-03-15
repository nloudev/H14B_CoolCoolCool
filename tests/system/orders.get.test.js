import { jest } from '@jest/globals';
import fs from 'fs';

const mPrisma = {
  order: {
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn()
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

describe('GET /orders/:id', () => {

  test('HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/orders/1`, {
      headers: { Authorization: 'Invalid token' }
    });
    expect(response.status).toBe(401);
  });

  test('HTTP 401: missing token', async () => {
    const response = await fetch(`${url}/orders/1`);
    expect(response.status).toBe(401);
  });

  test('HTTP 404: order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/999`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
  });

  test('HTTP 404: invalid id format', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/invalid-id`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
  });

  test('HTTP 404: extremely large id', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/999999999999`, {
      headers: { Authorization: 'Valid token' }
    });
    expect(response.status).toBe(404);
  });

  test('HTTP 200: retrieve order successfully', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      taxAmount: 63,
      payableAmount: 692.97,
      anticipatedMonetaryTotal: 629.97,
      createdAt: new Date(),
      inputData: JSON.parse(creation_input1)
    });

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toMatchObject({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      taxAmount: 63,
      payableAmount: 692.97,
      anticipatedMonetaryTotal: 629.97,
      createdAt: expect.any(String),
      ublDocument: expect.any(String)
    });
  });

  test('HTTP 200: order exists but no inputData', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-2025-003',
      status: 'order placed',
      totalCost: 100,
      taxAmount: 10,
      payableAmount: 110,
      anticipatedMonetaryTotal: 100,
      createdAt: new Date(),
      inputData: null
    });

    const response = await fetch(`${url}/orders/ORD-2025-003`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ orderId: 'ORD-2025-003' });
  });

  test('HTTP 200: multiple retrievals of same order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      taxAmount: 63,
      payableAmount: 692.97,
      anticipatedMonetaryTotal: 629.97,
      createdAt: new Date(),
      inputData: JSON.parse(creation_input1)
    });

    const response1 = await fetch(`${url}/orders/ORD-2025-001`, {
      headers: { Authorization: 'Valid token' }
    });
    const response2 = await fetch(`${url}/orders/ORD-2025-001`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  test('HTTP 500: database failure', async () => {
    prisma.order.findUnique.mockRejectedValue(new Error('Database connection failed'));

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toMatchObject({ error: 'Database connection failed' });
  });
});
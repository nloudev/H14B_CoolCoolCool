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
const creation_input2 = fs.readFileSync('tests/inputs/creation_input_2.json', 'utf-8');
const creation_input_missing = fs.readFileSync('tests/inputs/creation_input_missing.json', 'utf-8');
const creation_expectedContent = fs.readFileSync('tests/expected/creation_expected_1.xml', 'utf-8');

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

beforeEach(async () => {
  jest.clearAllMocks();
  await prisma.order.deleteMany({});
});

describe('POST /orders', () => {

  test('HTTP 400: malformed JSON', async () => {
    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: '{"invalid-json":}'
    });

    expect(response.status).toBe(400);
  });

  test('HTTP 401: invalid or missing token', async () => {
    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: { Authorization: 'Invalid token' },
      body: creation_input1
    });

    expect(response.status).toBe(401);
  });

  test('HTTP 422: missing required fields', async () => {
    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: creation_input_missing
    });

    expect(response.status).toBe(422);
  });

  test('HTTP 200: creates order and returns correct response with UBL XML', async () => {
    prisma.order.create.mockResolvedValue({
      orderId: 'ORD-2025-001',
      status: 'order placed',
      totalCost: 755.97,
      taxAmount: 63,
      payableAmount: 692.97,
      anticipatedMonetaryTotal: 629.97,
      loyaltyPointsEarned: 55,
      loyaltyPointsRedeemed: 0,
      createdAt: new Date()
    });

    const response = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Valid token'
      },
      body: creation_input1
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
      loyaltyPointsEarned: 55,
      loyaltyPointsRedeemed: 0,
      ublDocument: expect.any(String)
    });

    expect(data.ublDocument.replace(/\s/g, '')).toEqual(creation_expectedContent.replace(/\s/g, ''));
  });

  test('HTTP 200: multiple orders created correctly', async () => {
    prisma.order.create
      .mockResolvedValueOnce({
        orderId: 'ORD-2025-001',
        status: 'order placed',
        totalCost: 755.97,
        taxAmount: 63,
        payableAmount: 692.97,
        anticipatedMonetaryTotal: 629.97,
        loyaltyPointsEarned: 55,
        loyaltyPointsRedeemed: 0,
        createdAt: new Date()
      })
      .mockResolvedValueOnce({
        orderId: 'ORD-2025-002',
        status: 'order placed',
        totalCost: 755.97,
        taxAmount: 63,
        payableAmount: 692.97,
        anticipatedMonetaryTotal: 629.97,
        loyaltyPointsEarned: 55,
        loyaltyPointsRedeemed: 0,
        createdAt: new Date()
      });

    const response1 = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Valid token' },
      body: creation_input1
    });

    const response2 = await fetch(`${url}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Valid token' },
      body: creation_input2
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});
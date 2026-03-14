import { jest } from '@jest/globals';

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

import fs from 'fs';

const { default: app } = await import('../server.js');
const { create_xml } = await import('../input.js');

const creation_input1 = fs.readFileSync('src/tests/test_inputs/creation_input_1.json', 'utf-8');
const creation_input2 = fs.readFileSync('src/tests/test_inputs/creation_input_2.json', 'utf-8');
const creation_input_missing = fs.readFileSync('src/tests/test_inputs/creation_input_missing.json', 'utf-8');
const creation_expectedContent = fs.readFileSync('src/tests/expected_outputs/creation_expected_1.xml', 'utf-8');

let server;
let url;

beforeAll((done) => {  
    server = app.listen(0, () => {
        const port = server.address().port;
        url = `http://localhost:${port}`;
        done();
    });
});

afterAll((done) => {
    server.close(() => {
        setTimeout(done, 100); 
    });
});

//database cleanups
beforeEach(async () => {
    await prisma.order.deleteMany({});
});

afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
});

test('test create_xml function directly', () => {
    let xml_output = create_xml(JSON.parse(creation_input1));
    expect(xml_output.replace(/\s/g, '')).toEqual(creation_expectedContent.replace(/\s/g, ''));
});

test('HTTP 400: should return error for bad request (malformed JSON)', async () => {
    const response = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Valid token'
        },
        body: '{"invalid-json":}' // Purposefully broken JSON
    });

    expect(response.status).toBe(400);
});

test('HTTP 401: should return error for invalid/missing token', async () => {
    const response = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 'Authorization': 'Invalid token' },
        body: creation_input1
    });

    expect(response.status).toBe(401);
});

test('HTTP 422: should return error for missing required fields', async () => {
    const response = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Valid token' 
        },
        body: creation_input_missing
    });

    expect(response.status).toBe(422);
});

test('test create_xml through server', async ()=>{
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

    prisma.order.findUnique.mockResolvedValue({
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
            'Authorization': 'Valid token'
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

    const found = await prisma.order.findUnique({
        where: { orderId: 'ORD-2025-001' }
    });

    expect(found).toMatchObject({
        orderId: 'ORD-2025-001',
        status: 'order placed',
        totalCost: 755.97,
        taxAmount: 63,
        payableAmount: 692.97,
        anticipatedMonetaryTotal: 629.97,
        loyaltyPointsEarned: 55,
        loyaltyPointsRedeemed: 0,
        createdAt: expect.any(Date)
    });
});

test('test multiple creations through server, database correct', async ()=>{
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

    prisma.order.findUnique
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

    const response = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Valid token'
        },
        body: creation_input1
    });

    expect(response.status).toBe(200);

    const response2 = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Valid token'
        },
        body: creation_input2
    });

    expect(response2.status).toBe(200);

    const found1 = await prisma.order.findUnique({
        where: { orderId: 'ORD-2025-001' }
    });

    expect(found1).toMatchObject({
        orderId: 'ORD-2025-001',
        status: 'order placed',
        totalCost: 755.97,
        taxAmount: 63,
        payableAmount: 692.97,
        anticipatedMonetaryTotal: 629.97,
        loyaltyPointsEarned: 55,
        loyaltyPointsRedeemed: 0,
        createdAt: expect.any(Date)
    });

    const found2 = await prisma.order.findUnique({
        where: { orderId: 'ORD-2025-002' }
    });

    expect(found2).toMatchObject({
        orderId: 'ORD-2025-002',
        status: 'order placed',
        totalCost: 755.97,
        taxAmount: 63,
        payableAmount: 692.97,
        anticipatedMonetaryTotal: 629.97,
        loyaltyPointsEarned: 55,
        loyaltyPointsRedeemed: 0,
        createdAt: expect.any(Date)
    });
});

// Tests for GET route
test('GET /orders/{id} HTTP 401: invalid token', async () => {
    const response = await fetch(`${url}/orders/1`, {
        method: 'GET',
        headers: {
            'Authorization': 'Invalid token'
        }
    });

    expect(response.status).toBe(401);
});

test('GET /orders/{id} HTTP 401: missing token', async () => {

    const response = await fetch(`${url}/orders/1`, {
        method: 'GET'
    });

    expect(response.status).toBe(401);
});

test('GET /orders/{id} HTTP 404: order not found', async () => {

    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/999`, {
        method: 'GET',
        headers: {
            'Authorization': 'Valid token'
        }
    });

    expect(response.status).toBe(404);
});

test('GET /orders/{id} HTTP 404: invalid id format', async () => {

    const response = await fetch(`${url}/orders/invalid-id`, {
        method: 'GET',
        headers: {
            'Authorization': 'Valid token'
        }
    });

    expect(response.status).toBe(404);
});

test('GET /orders/{id} HTTP 404: extremely large id', async () => {

    prisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/999999999999`, {
        method: 'GET',
        headers: {
            'Authorization': 'Valid token'
        }
    });

    expect(response.status).toBe(404);
});

test('GET /orders/{id} HTTP 200: retrieve order successfully', async () => {

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
        method: 'GET',
        headers: {
            'Authorization': 'Valid token'
        }
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

test('GET /orders/{id} HTTP 200: order exists but no inputData', async () => {

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
        method: 'GET',
        headers: {
            'Authorization': 'Valid token'
        }
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toMatchObject({
        orderId: 'ORD-2025-003'
    });
});

test('GET /orders/{id} multiple retrievals', async () => {

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

test('GET /orders/{id} HTTP 500: database failure', async () => {

    prisma.order.findUnique.mockRejectedValue(
        new Error("Database connection failed")
    );

    const response = await fetch(`${url}/orders/ORD-2025-001`, {
        method: 'GET',
        headers: {
            'Authorization': 'Valid token'
        }
    });

    expect(response.status).toBe(500);

    const data = await response.json();

    expect(data).toMatchObject({
        message: "Vercel Error"
    });
});
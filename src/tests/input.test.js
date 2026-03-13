const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs');
const app = require('../server.js');
const { create_xml } = require('../input.js');

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
    create_xml(JSON.parse(creation_input1));
    expect(fs.readFileSync('src/creation_output.xml', 'utf-8').replace(/\s/g, '')).toEqual(creation_expectedContent.replace(/\s/g, ''));
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
        loyaltyPointsEarned: expect.any(Number),
        loyaltyPointsRedeemed: 0,
        ublDocument: expect.any(String)
    });

    expect(fs.readFileSync('src/creation_output.xml', 'utf-8').replace(/\s/g, '')).toEqual(creation_expectedContent.replace(/\s/g, ''));

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
        loyaltyPointsEarned: expect.any(Number),
        loyaltyPointsRedeemed: 0,
        createdAt: expect.any(Date)
    });
});


test('test multiple creations through server, database correct', async ()=>{
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
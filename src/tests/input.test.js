const input = require('../input.js');
const fs = require('fs');
const app = require('../server.js');

const inputPath = 'src/tests/test_inputs/creation_input_1.json';
const actualPath = 'src/creation_output.xml';
const expectedPath = 'src/tests/expected_outputs/creation_expected_1.xml';

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
test('test create_xml function directly', () => {
    const creation_input = fs.readFileSync(inputPath, 'utf-8');
    const expectedContent = fs.readFileSync(expectedPath, 'utf-8');

    input(creation_input);
    
    const actualContent = fs.readFileSync(actualPath, 'utf-8');
    expect(actualContent).toEqual(expectedContent);
});

test('HTTP 400: should return error for bad request (malformed JSON)', async () => {
    const response = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid-json":}' // Purposefully broken JSON
    });

    expect(response.status).toBe(400);
});

test('HTTP 401: should return error for invalid/missing token', async () => {
    const response = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 'Authorization': 'Invalid token' }
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
        body: JSON.stringify({ quantity: 2 }) // Missing 'productId'
    });

    expect(response.status).toBe(422);
});

test('test create_xml through server', async ()=>{
    const expected1 = fs.readFileSync(expectedPath, 'utf-8');
    
    const response = await fetch(`${url}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputPath)
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
        orderId: expect.any(Number),
        status: expect.any(Number),
        totalCost: expect.any(Number),
        taxAmount: expect.any(Number),
        payableAmount: expect.any(Number),
        anticipatedMonetaryTotal: expect.any(Number),
        loyaltyPointsEarned: expect.any(Number),
        loyaltyPointsRedeemed: expect.any(Number),
        ublDocument: expect.toEqual(expected1)
      });
})
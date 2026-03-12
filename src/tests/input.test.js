const fs = require('fs');
const app = require('../server.js');
const { create_xml } = require('../input.js');

const outputs_database = 'src/outputs_database';
const outputs_database_expected = 'src/tests/expected_outputs/outputs_database_expected1';
const outputs_database_expected2 = 'src/tests/expected_outputs/outputs_database_expected2';
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
        orderId: expect.any(Number),
        status: expect.any(Number),
        totalCost: expect.any(Number),
        taxAmount: expect.any(Number),
        payableAmount: expect.any(Number),
        anticipatedMonetaryTotal: expect.any(Number),
        loyaltyPointsEarned: expect.any(Number),
        loyaltyPointsRedeemed: expect.any(Number),
        ublDocument: expect.any(String)
    });

    expect(fs.readFileSync('src/creation_output.xml', 'utf-8').replace(/\s/g, '')).toEqual(creation_expectedContent.replace(/\s/g, ''));
});

test('test create_xml through server, database correct', async ()=>{
    fs.writeFileSync(outputs_database, '');
    const response = await fetch(`${url}/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Valid token'
        },
        body: creation_input1
    });
    expect(response.status).toBe(200);
    const actualOutput = fs.readFileSync(outputs_database, 'utf-8').replace(/\s/g, '');;
    const expectedContent = fs.readFileSync(outputs_database_expected, 'utf-8').replace(/\s/g, '');;
    expect(actualOutput).toEqual(expectedContent);
});

test('test multiple creations through server, database correct', async ()=>{
    fs.writeFileSync(outputs_database, '');
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

    const actualOutput = fs.readFileSync(outputs_database, 'utf-8').replace(/\s/g, '');;
    const expectedContent = fs.readFileSync(outputs_database_expected2, 'utf-8').replace(/\s/g, '');;
    expect(actualOutput).toEqual(expectedContent);
});
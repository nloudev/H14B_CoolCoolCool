import { jest } from '@jest/globals';

const { default: app } = await import('../../src/server.js');

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
});

describe('GET /health', () => {
  test('HTTP 200: returns status ok', async () => {
    const response = await fetch(`${url}/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      status: 'ok',
      uptime: expect.any(Number),
      timestamp: expect.any(String)
    });
  });
});
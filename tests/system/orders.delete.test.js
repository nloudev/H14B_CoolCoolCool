import { jest } from '@jest/globals';

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

const mockCreateXml = jest.fn();
await jest.unstable_mockModule('../../src/services/xmlService.js', () => ({
  create_xml: mockCreateXml,
  getLineExtension: jest.fn(),
  getTaxAmount: jest.fn(() => 0),
  getPayableAmount: jest.fn(() => 0),
}));

const { default: app } = await import('../../src/server.js');

const mockOrder = {
  order: { id: 'ORDER-123' },
  buyer: { companyId: 'BUYER-456' },
  seller: { companyId: 'SELLER-789' },
  items: [{ id: 'ITEM-1', quantity: 2, price: 10.50 }]
};

const mockDbOrder = {
  orderId: 'ORDER-123',
  status: 'order placed',
  totalCost: 0,
  taxAmount: 0,
  payableAmount: 0,
  anticipatedMonetaryTotal: 0,
  inputData: mockOrder,
  createdAt: new Date().toISOString()
};

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
  await mPrisma.$disconnect();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateXml.mockReturnValue('<xml/>');
});

describe('DELETE /orders/:id', () => {

  test('should successfully delete an order with valid ID', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockDbOrder);
    mPrisma.order.delete.mockResolvedValue(mockDbOrder);

    const response = await fetch(`${url}/orders/ORDER-123`, {
      method: 'DELETE',
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      message: 'Order deleted successfully',
      id: 'ORDER-123'
    });
    expect(data.deletedAt).toBeDefined();
  });

  test('should return 401 for missing Authorization header', async () => {
    const response = await fetch(`${url}/orders/ORDER-123`, {
      method: 'DELETE'
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('should return 401 for invalid token', async () => {
    const response = await fetch(`${url}/orders/ORDER-123`, {
      method: 'DELETE',
      headers: { Authorization: 'Invalid token' }
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('should return 404 when order does not exist', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    const response = await fetch(`${url}/orders/NONEXISTENT`, {
      method: 'DELETE',
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Order not found');
  });

  test('should return valid ISO timestamp on success', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockDbOrder);
    mPrisma.order.delete.mockResolvedValue(mockDbOrder);

    const response = await fetch(`${url}/orders/ORDER-123`, {
      method: 'DELETE',
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.deletedAt).toBeDefined();
    const deleteTime = new Date(data.deletedAt);
    expect(deleteTime.getTime()).not.toBeNaN();
  });

  test('should return 500 when database throws an error', async () => {
    mPrisma.order.findUnique.mockRejectedValue(new Error('Database connection failed'));

    const response = await fetch(`${url}/orders/ORDER-123`, {
      method: 'DELETE',
      headers: { Authorization: 'Valid token' }
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe('Internal server error');
  });

  test('should call findUnique and delete with correct ID', async () => {
    mPrisma.order.findUnique.mockResolvedValue(mockDbOrder);
    mPrisma.order.delete.mockResolvedValue(mockDbOrder);

    await fetch(`${url}/orders/ORDER-123`, {
      method: 'DELETE',
      headers: { Authorization: 'Valid token' }
    });

    expect(mPrisma.order.findUnique).toHaveBeenCalledWith({ where: { orderId: 'ORDER-123' } });
    expect(mPrisma.order.delete).toHaveBeenCalledWith({ where: { orderId: 'ORDER-123' } });
  });

  test('should NOT call delete when order is not found', async () => {
    mPrisma.order.findUnique.mockResolvedValue(null);

    await fetch(`${url}/orders/NONEXISTENT`, {
      method: 'DELETE',
      headers: { Authorization: 'Valid token' }
    });

    expect(mPrisma.order.delete).not.toHaveBeenCalled();
  });

  test('should handle malformed JSON in request body', async () => {
    const response = await fetch(`${url}/orders/ORDER-123`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Valid token',
        'Content-Type': 'application/json'
      },
      body: '{"invalid-json":}'
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Bad JSON');
  });
});
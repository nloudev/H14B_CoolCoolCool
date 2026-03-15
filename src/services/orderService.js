import prisma from '../prisma.js';

export async function createOrder(data) {
  return await prisma.order.create({ data });
}

export async function getOrderById(orderId) {
  return await prisma.order.findUnique({ where: { orderId } });
}

export async function deleteOrderById(orderId) {
  return await prisma.order.delete({ where: { orderId } });
}

export async function getAllOrders(filters) {
  return await prisma.order.findMany({ where: filters });
}
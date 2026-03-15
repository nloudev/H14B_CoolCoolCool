import { create_xml, getLineExtension, getTaxAmount, getPayableAmount } from '../services/xmlService.js';
import { createOrder, getOrderById, deleteOrderById, getAllOrders } from '../services/orderService.js';

const LOYALTY_COEFF = 0.08;

export async function postOrder(req, res) {
  const { order, buyer, seller, delivery, tax, items, loyaltyPointsRedeemed } = req.body;

  if (!order?.id || !buyer?.companyId || !items || !Array.isArray(items)) {
    return res.status(422).json({
      error: 'Missing required fields: order.id, buyer.companyId, and items array are mandatory.'
    });
  }

  try {
    const xml_output = create_xml(req.body);
    const taxAmount = Number(getTaxAmount(req.body).toFixed(2));
    const payableAmount = Number(getPayableAmount(req.body).toFixed(2));
    const lineExtensionAmount = getLineExtension(req.body);

    await createOrder({
      orderId: order.id,
      status: 'order placed',
      inputData: req.body,
      totalCost: taxAmount + payableAmount,
      taxAmount,
      payableAmount,
      anticipatedMonetaryTotal: lineExtensionAmount,
      loyaltyPointsEarned: Math.round(payableAmount * LOYALTY_COEFF),
      loyaltyPointsRedeemed: 0,
    });

    return res.status(200).json({
      orderId: order.id,
      status: 'order placed',
      totalCost: taxAmount + payableAmount,
      taxAmount,
      payableAmount,
      anticipatedMonetaryTotal: lineExtensionAmount,
      loyaltyPointsEarned: Math.round(payableAmount * LOYALTY_COEFF),
      loyaltyPointsRedeemed: 0,
      ublDocument: xml_output
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getOrder(req, res) {
  const orderId = req.params.id;

  try {
    const found = await getOrderById(orderId);

    if (!found) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const xml_output = create_xml(found.inputData);

    return res.status(200).json({
      orderId: found.orderId,
      status: found.status,
      totalCost: found.totalCost,
      taxAmount: found.taxAmount,
      payableAmount: found.payableAmount,
      anticipatedMonetaryTotal: found.anticipatedMonetaryTotal,
      createdAt: found.createdAt,
      ublDocument: xml_output
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteOrder(req, res) {
    const orderId = req.params.id;

  try {
    const found = await getOrderById(orderId);

    if (!found) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await deleteOrderById(orderId);

    return res.status(200).json({
      message: 'Order deleted successfully',
      id: orderId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      detail: error.message
    });
  }
}

export async function listOrders(req, res) {
  const { buyerId, status } = req.query;

  const filters = {};
  if (buyerId) filters.buyerId = buyerId;
  if (status) filters.status = status;

  try {
    const orders = await getAllOrders(filters);
    return res.status(200).json(orders.map(o => ({
      orderId: o.orderId,
      status: o.status,
      totalCost: o.totalCost,
      createdAt: o.createdAt
    })));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}


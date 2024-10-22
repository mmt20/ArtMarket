import paypal from '../../helpers/paypal.js';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(sk_test_51QCKeKBGwlrORfS3cvFWRw3A2r00Tu4wGc9hN2fx6br9GPPiy2G6xzAHBrOn2Pp8QZqj3mB47Ga8JVXOHIHE9I0K008vfg7qVH);

const prisma = new PrismaClient();


export const createOrder = async (req, res)=>{
  const { cartId, userId , addressId} = req.body;

  try {
    // Fetch cart items from the database
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Format the items for Stripe
    const lineItems = cart.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.title,
          description: item.product.description,
        },
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.quantity,
    }));

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:5173/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/checkout-cancel`,
      customer_email: (await prisma.user.findUnique({ where: { id: userId } })).email,
      metadata: { cartId: cartId.toString(), userId: userId.toString() },
    });

    const newOrder = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        cartId: parseInt(cartId),
        addressId,
        totalAmount: session.amount_total / 100,
        orderStatus: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        paymentId: session.payment_intent,
        payerId: session.customer,
        orderDate: new Date(),
        orderUpdateDate: new Date(),
      },
    });

    // Return session ID to the client
    // res.json({ lineItems });
    res.json({ id: session.id , orderId:newOrder.id});
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
// Capture Payment
export const capturePayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;

    let order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      // include: { cartItems: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order cannot be found',
      });
    }

    
    const session = await stripe.checkout.sessions.retrieve(paymentId);
      if (session.payment_status === 'paid') {
        order = await prisma.order.update({
          where: { id: parseInt(order.id) },
          data: {
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            paymentId,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment not completed',
        });
      }
    

    // Update product stock
    for (let item of order.cartItems) {
      let product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) },
      });

      if (!product || product.totalStock < item.quantity) {
        return res.status(404).json({
          success: false,
          message: `Not enough stock for this product ${
            product ? product.title : 'N/A'
          }`,
        });
      }

      await prisma.product.update({
        where: { id: parseInt(product.id) },
        data: {
          totalStock: product.totalStock - item.quantity,
        },
      });
    }

    await prisma.cart.delete({
      where: { id: parseInt(order.cartId) },
    });

    res.status(200).json({
      success: true,
      message: 'Order confirmed',
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
    });
  }
};

// Get All Orders by User
export const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
    });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: 'No orders found!',
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
    });
  }
};

// Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found!',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
    });
  }
};

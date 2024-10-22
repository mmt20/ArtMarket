import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: '2022-11-15',
});
const prisma = new PrismaClient();

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(` Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event for checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      await createOrder(session);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Return a response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

export const createOrder = async (session) => {
  const cartId = session.metadata.cartId;
  const userId = session.metadata.userId;
  const addressId = session.metadata.addressId;

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
    const lineItems = cart.items.map((item) => ({
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
      success_url: `${req.protocol}://${req.get('host')}/shop/account`,
      cancel_url: `${req.protocol}://${req.get('host')}/shop/checkout`,
      customer_email: (
        await prisma.user.findUnique({ where: { id: userId } })
      ).email,
      metadata: {
        cartId: cartId.toString(),
        userId: userId.toString(),
        addressId: session.metadata.addressId,
      },
    });

    const newOrder = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        cartId: parseInt(cartId),
        addressId: parseInt(addressId),
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
    res.json({ id: session.id, orderId: newOrder.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Capture payment after successful checkout
export const capturePayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;

    // Find the order by ID
    let order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order cannot be found',
      });
    }

    // Retrieve payment session
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

      // Update product stock
      for (let item of order.cartItems) {
        let product = await prisma.product.findUnique({
          where: { id: parseInt(item.productId) },
        });

        if (!product || product.totalStock < item.quantity) {
          return res.status(404).json({
            success: false,
            message: `Not enough stock for product ${
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

      // Delete the cart after successful payment
      await prisma.cart.delete({
        where: { id: parseInt(order.cartId) },
      });

      res.status(200).json({
        success: true,
        message: 'Order confirmed',
        data: order,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
      });
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'An error occurred during payment capture!',
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

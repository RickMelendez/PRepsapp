const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

// Create subscription
router.post('/create', protect, sellerOnly, async (req, res) => {
  const { paymentMethodId } = req.body;
  try {
    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: req.user.email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }], // Add price ID from Stripe
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user subscription status in DB
    await User.findByIdAndUpdate(req.user.id, { subscriptionActive: true });

    res.status(200).json({
      message: 'Subscription created successfully',
      subscriptionId: subscription.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel subscription
router.post('/cancel', protect, sellerOnly, async (req, res) => {
  const { subscriptionId } = req.body;
  try {
    const deleted = await stripe.subscriptions.del(subscriptionId);
    await User.findByIdAndUpdate(req.user.id, { subscriptionActive: false });
    res.status(200).json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

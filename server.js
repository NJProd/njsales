const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const app = express();

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(cors());
app.use(express.json());

// Stripe setup (conditional - only if STRIPE_SECRET_KEY is set)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// API endpoint to get Google Maps API key
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  });
});

// Get all leads from Google Sheet
app.get('/api/leads', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A:J',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.json([]);
    }

    const headers = rows[0];
    const leads = rows.slice(1).map((row, index) => {
      const lead = { id: index + 1 };
      headers.forEach((header, i) => {
        lead[header.toLowerCase().replace(/\s+/g, '_')] = row[i] || '';
      });
      return lead;
    });

    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Add a new lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, address, phone, website, email, notes, lat, lng, called, status } = req.body;
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A:J',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          name || '',
          address || '',
          phone || '',
          website || '',
          email || '',
          notes || '',
          lat || '',
          lng || '',
          called ? 'Yes' : 'No',
          status || 'New'
        ]],
      },
    });

    res.json({ success: true, message: 'Lead added successfully' });
  } catch (error) {
    console.error('Error adding lead:', error);
    res.status(500).json({ error: 'Failed to add lead' });
  }
});

// Update lead status (called/not called)
app.put('/api/leads/:rowIndex', async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex) + 1; // +1 for header row
    const { called, status, notes } = req.body;

    // Update the called status (column I) and status (column J)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Leads!I${rowIndex + 1}:J${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[called ? 'Yes' : 'No', status || '']],
      },
    });

    // Update notes if provided
    if (notes !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Leads!F${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[notes]],
        },
      });
    }

    res.json({ success: true, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Initialize sheet with headers if empty
app.post('/api/init-sheet', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A1:J1',
    });

    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Leads!A1:J1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['Name', 'Address', 'Phone', 'Website', 'Email', 'Notes', 'Lat', 'Lng', 'Called', 'Status']],
        },
      });
    }

    res.json({ success: true, message: 'Sheet initialized' });
  } catch (error) {
    console.error('Error initializing sheet:', error);
    res.status(500).json({ error: 'Failed to initialize sheet' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// =====================
// STRIPE API ENDPOINTS
// =====================

// Check if Stripe is configured
app.get('/api/stripe/status', (req, res) => {
  res.json({ 
    configured: !!stripe,
    publicKey: process.env.STRIPE_PUBLIC_KEY || null
  });
});

// Create a Stripe customer for a lead
app.post('/api/stripe/customers', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { leadId, name, email, phone, address } = req.body;
    
    const customer = await stripe.customers.create({
      name,
      email,
      phone,
      metadata: { leadId },
      address: address ? { line1: address } : undefined,
    });
    
    res.json({ 
      success: true, 
      customerId: customer.id,
      customer 
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a one-time payment (Payment Intent)
app.post('/api/stripe/payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { amount, customerId, description, leadId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      description,
      metadata: { leadId },
    });
    
    res.json({ 
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a subscription
app.post('/api/stripe/subscriptions', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { customerId, priceId, leadId } = req.body;
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { leadId },
    });
    
    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel a subscription
app.delete('/api/stripe/subscriptions/:subscriptionId', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { subscriptionId } = req.params;
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    
    res.json({
      success: true,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer's payment history
app.get('/api/stripe/customers/:customerId/payments', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { customerId } = req.params;
    
    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });
    
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });
    
    res.json({
      success: true,
      payments: payments.data,
      charges: charges.data,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer's subscriptions
app.get('/api/stripe/customers/:customerId/subscriptions', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { customerId } = req.params;
    
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });
    
    res.json({
      success: true,
      subscriptions: subscriptions.data,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe Checkout Session (for hosted payment page)
app.post('/api/stripe/checkout', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { customerId, leadId, amount, description, isSubscription, priceId, successUrl, cancelUrl } = req.body;
    
    let sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      success_url: successUrl || `${req.headers.origin}/crm?payment=success`,
      cancel_url: cancelUrl || `${req.headers.origin}/crm?payment=cancelled`,
      metadata: { leadId },
    };
    
    if (isSubscription && priceId) {
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
    } else {
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: description || 'One-time payment' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook handler
app.post('/api/stripe/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  console.log('Stripe webhook event:', event.type);
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded for ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
      // TODO: Update lead in Firebase with payment info
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log(`Subscription ${subscription.id} ${event.type.split('.')[2]} - Status: ${subscription.status}`);
      // TODO: Update lead subscription status in Firebase
      break;
      
    case 'customer.subscription.deleted':
      const canceledSub = event.data.object;
      console.log(`Subscription ${canceledSub.id} canceled`);
      // TODO: Update lead subscription status in Firebase
      break;
      
    case 'invoice.paid':
      const invoice = event.data.object;
      console.log(`Invoice ${invoice.id} paid - Amount: ${invoice.amount_paid / 100}`);
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`Invoice ${failedInvoice.id} payment failed`);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

// List available Stripe prices (for subscription plans)
app.get('/api/stripe/prices', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 20,
      expand: ['data.product'],
    });
    
    res.json({
      success: true,
      prices: prices.data,
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

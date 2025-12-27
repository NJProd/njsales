import React, { useState, useEffect } from 'react';
import './StripeBilling.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function StripeBilling({ lead, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [stripePublicKey, setStripePublicKey] = useState(null);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Check Stripe status on mount
  useEffect(() => {
    checkStripeStatus();
  }, []);

  // Fetch payment history when customer ID exists
  useEffect(() => {
    if (lead.stripeCustomerId && stripeConfigured) {
      fetchPaymentHistory();
      fetchSubscriptions();
    }
  }, [lead.stripeCustomerId, stripeConfigured]);

  const checkStripeStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/stripe/status`);
      const data = await response.json();
      setStripeConfigured(data.configured);
      setStripePublicKey(data.publicKey);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };

  const createCustomer = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/stripe/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onUpdate({ 
          stripeCustomerId: data.customerId,
          lastUpdated: Date.now()
        });
      } else {
        alert('Failed to create customer: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/stripe/customers/${lead.stripeCustomerId}/payments`);
      const data = await response.json();
      if (data.success) {
        setPayments(data.charges || []);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/stripe/customers/${lead.stripeCustomerId}/subscriptions`);
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        
        // Update lead with subscription status
        if (data.subscriptions.length > 0) {
          const activeSub = data.subscriptions.find(s => s.status === 'active');
          if (activeSub) {
            onUpdate({
              stripeSubscriptionStatus: 'active',
              stripeSubscriptionId: activeSub.id,
              monthlyRate: activeSub.items.data[0]?.price?.unit_amount / 100,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const initiatePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    setProcessingPayment(true);
    try {
      const response = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: lead.stripeCustomerId,
          leadId: lead.id,
          amount: parseFloat(paymentAmount),
          description: paymentDescription || `Payment for ${lead.name}`,
          isSubscription: false,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
        setShowPaymentForm(false);
        setPaymentAmount('');
        setPaymentDescription('');
      } else {
        alert('Failed to create checkout session: ' + data.error);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/stripe/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchSubscriptions();
        onUpdate({
          stripeSubscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  // Not configured state
  if (!stripeConfigured) {
    return (
      <div className="stripe-billing">
        <div className="stripe-not-configured">
          <div className="stripe-icon">💳</div>
          <h3>Stripe Not Configured</h3>
          <p>To enable billing features, add your Stripe API keys to the server environment:</p>
          <div className="env-instructions">
            <code>STRIPE_SECRET_KEY=sk_...</code>
            <code>STRIPE_PUBLIC_KEY=pk_...</code>
          </div>
          <p className="help-text">Contact your administrator to set up Stripe integration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stripe-billing">
      {/* Customer Section */}
      <div className="billing-section">
        <h4>👤 Stripe Customer</h4>
        {lead.stripeCustomerId ? (
          <div className="customer-info">
            <div className="customer-badge">
              <span className="customer-icon">✓</span>
              <span>Connected to Stripe</span>
            </div>
            <div className="customer-id">
              <span className="label">Customer ID:</span>
              <code>{lead.stripeCustomerId}</code>
            </div>
          </div>
        ) : (
          <div className="no-customer">
            <p>No Stripe customer linked yet.</p>
            <button 
              className="create-customer-btn"
              onClick={createCustomer}
              disabled={loading}
            >
              {loading ? '⏳ Creating...' : '➕ Create Stripe Customer'}
            </button>
          </div>
        )}
      </div>

      {/* Only show billing features if customer exists */}
      {lead.stripeCustomerId && (
        <>
          {/* Quick Payment */}
          <div className="billing-section">
            <div className="section-header">
              <h4>💰 Collect Payment</h4>
              <button 
                className="new-payment-btn"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
              >
                {showPaymentForm ? '✕ Cancel' : '+ New Payment'}
              </button>
            </div>
            
            {showPaymentForm && (
              <div className="payment-form">
                <div className="form-row">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="What's this payment for?"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                  />
                </div>
                <button 
                  className="submit-payment-btn"
                  onClick={initiatePayment}
                  disabled={processingPayment || !paymentAmount}
                >
                  {processingPayment ? '⏳ Processing...' : `💳 Charge $${paymentAmount || '0.00'}`}
                </button>
                <p className="payment-note">
                  Opens Stripe Checkout in a new tab for secure payment
                </p>
              </div>
            )}
          </div>

          {/* Active Subscriptions */}
          <div className="billing-section">
            <h4>🔄 Subscriptions</h4>
            {subscriptions.length > 0 ? (
              <div className="subscriptions-list">
                {subscriptions.map(sub => (
                  <div key={sub.id} className={`subscription-card ${sub.status}`}>
                    <div className="subscription-info">
                      <span className={`status-badge ${sub.status}`}>
                        {sub.status === 'active' ? '🟢' : sub.status === 'past_due' ? '🟡' : '🔴'} {sub.status}
                      </span>
                      <span className="subscription-amount">
                        ${(sub.items.data[0]?.price?.unit_amount || 0) / 100}/mo
                      </span>
                    </div>
                    <div className="subscription-meta">
                      <span>Started: {new Date(sub.start_date * 1000).toLocaleDateString()}</span>
                      <span>Next billing: {new Date(sub.current_period_end * 1000).toLocaleDateString()}</span>
                    </div>
                    {sub.status === 'active' && (
                      <button 
                        className="cancel-subscription-btn"
                        onClick={() => cancelSubscription(sub.id)}
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-subscriptions">No active subscriptions</p>
            )}
          </div>

          {/* Payment History */}
          <div className="billing-section">
            <h4>📋 Payment History</h4>
            {payments.length > 0 ? (
              <div className="payments-list">
                {payments.slice(0, 10).map(payment => (
                  <div key={payment.id} className={`payment-row ${payment.status}`}>
                    <div className="payment-info">
                      <span className={`payment-status ${payment.status}`}>
                        {payment.status === 'succeeded' ? '✅' : payment.status === 'pending' ? '⏳' : '❌'}
                      </span>
                      <span className="payment-amount">${(payment.amount || 0) / 100}</span>
                      <span className="payment-description">{payment.description || 'Payment'}</span>
                    </div>
                    <span className="payment-date">
                      {new Date(payment.created * 1000).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-payments">No payments yet</p>
            )}
          </div>

          {/* Billing Summary */}
          <div className="billing-section summary">
            <h4>📊 Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Paid</span>
                <span className="summary-value">${lead.totalPaid || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Monthly Rate</span>
                <span className="summary-value">${lead.monthlyRate || 0}/mo</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Subscription</span>
                <span className={`summary-value ${lead.stripeSubscriptionStatus || 'none'}`}>
                  {lead.stripeSubscriptionStatus || 'None'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import fetch from 'node-fetch';

// Obtain OAuth access token from PayPal
export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const baseUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !secret) {
    throw new Error('Missing PayPal credentials. Ensure PAYPAL_CLIENT_ID and PAYPAL_SECRET are set.');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`PayPal token error: ${tokenRes.status} ${text}`);
  }

  const { access_token } = await tokenRes.json();
  return { accessToken: access_token, baseUrl };
}

export const createPayPalOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ message: 'Invalid amount for PayPal order' });
    }
    const resolvedCurrency = (currency || 'USD').toUpperCase();
    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: resolvedCurrency, value: String(Number(amount).toFixed(2)) }
          }
        ]
      })
    });

    const orderText = await orderRes.text();
    let order;
    try {
      order = JSON.parse(orderText);
    } catch (e) {
      // Ensure we always return JSON to the client
      console.error('PayPal create-order non-JSON response:', orderText);
      return res.status(500).json({ message: 'Error creating PayPal order', details: orderText });
    }
    if (!orderRes.ok) {
      console.error('PayPal create-order error response:', order);
      return res.status(500).json({ message: 'Error creating PayPal order', details: order });
    }
    // Return minimal payload expected by frontend SDK
    res.json({ id: order.id });
  } catch (err) {
    console.error('PayPal create-order exception:', err);
    res.status(500).json({ message: 'Error creating PayPal order', error: err?.message || 'Unknown error' });
  }
};

export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Missing orderId' });
    }
    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const captureText = await captureRes.text();
    let capture;
    try {
      capture = JSON.parse(captureText);
    } catch (e) {
      console.error('PayPal capture-order non-JSON response:', captureText);
      return res.status(500).json({ message: 'Error capturing PayPal order', details: captureText });
    }
    if (!captureRes.ok) {
      console.error('PayPal capture-order error response:', capture);
      return res.status(500).json({ message: 'Error capturing PayPal order', details: capture });
    }
    res.json(capture);
  } catch (err) {
    console.error('PayPal capture-order exception:', err);
    res.status(500).json({ message: 'Error capturing PayPal order', error: err?.message || 'Unknown error' });
  }
};


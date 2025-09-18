import fetch from 'node-fetch';

// Obtain OAuth access token from PayPal
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const baseUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

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
      return res.status(500).json({ message: 'Error creating PayPal order', details: orderText });
    }
    if (!orderRes.ok) {
      return res.status(500).json({ message: 'Error creating PayPal order', details: order });
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating PayPal order', error: err?.message || 'Unknown error' });
  }
};

export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
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
      return res.status(500).json({ message: 'Error capturing PayPal order', details: captureText });
    }
    if (!captureRes.ok) {
      return res.status(500).json({ message: 'Error capturing PayPal order', details: capture });
    }
    res.json(capture);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error capturing PayPal order', error: err?.message || 'Unknown error' });
  }
};


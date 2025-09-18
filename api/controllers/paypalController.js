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
    const { amount, currency = 'INR' } = req.body;
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
            amount: { currency_code: currency, value: amount }
          }
        ]
      })
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      return res.status(500).json({ message: 'Error creating PayPal order', details: order });
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating PayPal order');
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

    const capture = await captureRes.json();
    if (!captureRes.ok) {
      return res.status(500).json({ message: 'Error capturing PayPal order', details: capture });
    }
    res.json(capture);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error capturing PayPal order');
  }
};


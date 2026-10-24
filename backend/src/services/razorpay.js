const crypto = require('crypto');

const keyId = () => process.env.RAZORPAY_KEY_ID || '';
const keySecret = () => process.env.RAZORPAY_KEY_SECRET || '';
function requireKeys() {
  if (!keyId() || !keySecret()) throw Object.assign(new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.'), { status: 503 });
}
function basicAuth() {
  requireKeys();
  return `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}`;
}
async function createOrder(amount, currency = 'INR', receipt = `saino-${Date.now()}`) {
  requireKeys();
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(Number(amount)), currency, receipt: String(receipt).slice(0, 40) })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw Object.assign(new Error(data.error?.description || 'Razorpay order creation failed.'), { status: 502 });
  return { keyId: keyId(), order: data };
}
function verifySignature(orderId, paymentId, signature) {
  if (!orderId || !paymentId || !/^[a-f0-9]{64}$/i.test(String(signature || '')) || !keySecret()) return false;
  const expected = crypto.createHmac('sha256', keySecret()).update(`${orderId}|${paymentId}`).digest();
  const actual = Buffer.from(String(signature), 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
async function fetchCapturedPayment(paymentId) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: basicAuth() }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error?.description || 'Could not verify Razorpay payment.'), { status: 502 });
  return data;
}
async function refund(paymentId, amount) {
  requireKeys();
  if (!paymentId || !Number.isInteger(amount) || amount <= 0) throw new Error('Invalid refund request');
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST', headers: { Authorization: basicAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, speed: 'normal' })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw Object.assign(new Error(data.error?.description || 'Refund request failed'), { status: 502 });
  return data;
}

module.exports = { refund, get keyId() { return keyId(); }, createOrder, verifySignature, fetchCapturedPayment };

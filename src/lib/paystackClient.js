/**
 * Paystack API Client — Server-side only.
 * Handles transaction initialization, verification, and webhook signature validation.
 */

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    console.warn('PAYSTACK_SECRET_KEY is not set! Payment operations will fail.');
  }
  return key || '';
}

/**
 * Pricing configuration — amounts in kobo (1 Naira = 100 kobo).
 * Monthly = Annual ÷ 12, rounded to nearest ₦10,000.
 */
export const PLAN_PRICING = {
  starter: {
    annual: 45000000,   // ₦450,000
    monthly: 4000000,   // ₦40,000
  },
  growth: {
    annual: 70000000,   // ₦700,000
    monthly: 6000000,   // ₦60,000
  },
  enterprise: {
    annual: 130000000,  // ₦1,300,000
    monthly: 11000000,  // ₦110,000
  },
};

/**
 * Plan codes mapped to environment variables (created via Paystack API)
 */
export const PLAN_CODES = {
  starter: {
    annual: process.env.PAYSTACK_PLAN_STARTER_ANNUAL,
    monthly: process.env.PAYSTACK_PLAN_STARTER_MONTHLY,
  },
  growth: {
    annual: process.env.PAYSTACK_PLAN_GROWTH_ANNUAL,
    monthly: process.env.PAYSTACK_PLAN_GROWTH_MONTHLY,
  },
  enterprise: {
    annual: process.env.PAYSTACK_PLAN_ENTERPRISE_ANNUAL,
    monthly: process.env.PAYSTACK_PLAN_ENTERPRISE_MONTHLY,
  },
};

/**
 * Plan limits configuration for reference.
 */
export const PLAN_LIMITS = {
  free:       { maxStudents: 10,   maxClasses: 3  },
  starter:    { maxStudents: 100,  maxClasses: 10 },
  growth:     { maxStudents: 500,  maxClasses: 40 },
  enterprise: { maxStudents: 9999, maxClasses: 99 },
};

/**
 * Makes an authenticated request to the Paystack API.
 */
async function paystackRequest(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    console.error('Paystack API error:', data);
    throw new Error(data.message || 'Paystack API request failed');
  }

  return data;
}

/**
 * Initialize a Paystack transaction.
 * @param {string} email - Customer email
 * @param {number} amountKobo - Amount in kobo
 * @param {object} metadata - Extra metadata (school_id, tier, billing_cycle)
 * @param {string} callbackUrl - URL to redirect to after payment
 * @returns {object} { authorization_url, access_code, reference }
 */
export async function initializeTransaction(email, amountKobo, metadata, callbackUrl) {
  // Determine plan code based on tier and billing cycle to enable auto-renew
  let planCode = undefined;
  if (metadata && metadata.tier && metadata.billing_cycle) {
    const tierCodes = PLAN_CODES[metadata.tier];
    if (tierCodes) {
      planCode = tierCodes[metadata.billing_cycle];
    }
  }

  const payload = {
    email,
    amount: amountKobo,
    callback_url: callbackUrl,
    metadata: {
      ...metadata,
      custom_fields: [
        { display_name: 'School ID', variable_name: 'school_id', value: metadata.school_id },
        { display_name: 'Plan', variable_name: 'tier', value: metadata.tier },
        { display_name: 'Billing Cycle', variable_name: 'billing_cycle', value: metadata.billing_cycle },
      ]
    },
    channels: ['card', 'bank', 'ussd', 'bank_transfer'],
  };

  if (planCode) {
    payload.plan = planCode;
  }

  const data = await paystackRequest('POST', '/transaction/initialize', payload);

  return data.data;
}

/**
 * Refund a transaction.
 * @param {string} transaction - Transaction ID or reference
 * @param {number} amountKobo - Amount in kobo to refund
 * @returns {object} Response data
 */
export async function refundTransaction(transaction, amountKobo) {
  const data = await paystackRequest('POST', '/refund', {
    transaction,
    amount: amountKobo,
  });
  return data.data;
}

/**
 * Fetch a subscription by code.
 * @param {string} code - The subscription code
 * @returns {object} The subscription data (includes email_token)
 */
export async function fetchSubscription(code) {
  const data = await paystackRequest('GET', `/subscription/${code}`);
  return data.data;
}

/**
 * Disable a Paystack subscription.
 * @param {string} code - The subscription code
 * @param {string} token - The email token for the subscription
 * @returns {object} Response data
 */
export async function disableSubscription(code, token) {
  const data = await paystackRequest('POST', '/subscription/disable', {
    code,
    token
  });
  return data.data;
}

/**
 * Verify a Paystack transaction by reference.
 * @param {string} reference - Transaction reference
 * @returns {object} Full transaction data from Paystack
 */
export async function verifyTransaction(reference) {
  const data = await paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
  return data.data;
}

/**
 * Verify Paystack webhook signature using HMAC SHA-512.
 * @param {string} body - Raw request body string
 * @param {string} signature - x-paystack-signature header
 * @returns {boolean} Whether the signature is valid
 */
export async function verifyWebhookSignature(body, signature) {
  if (!signature) return false;

  const secretKey = getSecretKey();
  // Use Web Crypto API (available in Next.js Edge and Node.js)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === signature;
}

/**
 * Get the price in kobo for a given tier and billing cycle.
 * @param {string} tier - 'starter', 'growth', or 'enterprise'
 * @param {string} cycle - 'monthly' or 'annual'
 * @returns {number} Amount in kobo
 */
export function getPriceKobo(tier, cycle) {
  const pricing = PLAN_PRICING[tier];
  if (!pricing) throw new Error(`Invalid tier: ${tier}`);
  const amount = pricing[cycle];
  if (!amount) throw new Error(`Invalid billing cycle: ${cycle}`);
  return amount;
}

/**
 * Calculate the subscription period end date from now.
 * @param {string} cycle - 'monthly' or 'annual'
 * @returns {Date}
 */
export function calculatePeriodEnd(cycle) {
  const now = new Date();
  if (cycle === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
}

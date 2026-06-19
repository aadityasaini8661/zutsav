const axios    = require('axios');
const crypto   = require('crypto');
const settings = require('./settingsService');

const SANDBOX_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const PROD_URL    = 'https://api.phonepe.com/apis/hermes';

async function _cfg() {
  const env        = await settings.get('phonepeEnv',        process.env.PHONEPE_ENV);
  const merchantId = await settings.get('phonepeMerchantId', process.env.PHONEPE_MERCHANT_ID  || 'PGTESTPAYUAT86');
  const saltKey    = await settings.get('phonepeSaltKey',    process.env.PHONEPE_SALT_KEY     || '96434309-7796-489d-8924-ab56988a6076');
  const saltIndex  = await settings.get('phonepeSaltIndex',  process.env.PHONEPE_SALT_INDEX   || '1');
  const baseUrl    = env === 'prod' ? PROD_URL : SANDBOX_URL;
  return { merchantId, saltKey, saltIndex, baseUrl };
}

/**
 * Create a PhonePe payment request.
 * Returns { redirectUrl, merchantTransactionId }
 */
const createPhonePeOrder = async ({ merchantTransactionId, amount, userId, callbackUrl, redirectUrl }) => {
  const { merchantId, saltKey, saltIndex, baseUrl } = await _cfg();

  const payload = {
    merchantId,
    merchantTransactionId,
    merchantUserId:    `USR_${userId}`,
    amount:            Math.round(amount * 100),
    redirectUrl,
    redirectMode:      'REDIRECT',
    callbackUrl,
    paymentInstrument: { type: 'PAY_PAGE' },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const checksum      = crypto.createHash('sha256')
    .update(base64Payload + '/pg/v1/pay' + saltKey)
    .digest('hex') + '###' + saltIndex;

  const { data } = await axios.post(
    `${baseUrl}/pg/v1/pay`,
    { request: base64Payload },
    {
      headers: {
        'Content-Type':  'application/json',
        'X-VERIFY':      checksum,
        'X-MERCHANT-ID': merchantId,
      },
      timeout: 15000,
    }
  );

  if (!data?.success) throw new Error(data?.message || 'PhonePe order creation failed');
  return { redirectUrl: data.data?.instrumentResponse?.redirectInfo?.url, merchantTransactionId };
};

/**
 * Check payment status with PhonePe.
 */
const checkPhonePeStatus = async (merchantTransactionId) => {
  const { merchantId, saltKey, saltIndex, baseUrl } = await _cfg();
  const path     = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const checksum = crypto.createHash('sha256')
    .update(path + saltKey)
    .digest('hex') + '###' + saltIndex;

  const { data } = await axios.get(
    `${baseUrl}${path}`,
    {
      headers: {
        'Content-Type':  'application/json',
        'X-VERIFY':      checksum,
        'X-MERCHANT-ID': merchantId,
      },
      timeout: 15000,
    }
  );

  return {
    success:       data?.success && data?.data?.state === 'COMPLETED',
    code:          data?.code,
    state:         data?.data?.state,
    transactionId: data?.data?.transactionId,
  };
};

/**
 * Verify PhonePe webhook callback.
 */
const verifyWebhookChecksum = async (base64Response, xVerifyHeader) => {
  const { saltKey, saltIndex } = await _cfg();
  const expected = crypto.createHash('sha256')
    .update(base64Response + saltKey)
    .digest('hex') + '###' + saltIndex;
  return expected === xVerifyHeader;
};

module.exports = { createPhonePeOrder, checkPhonePeStatus, verifyWebhookChecksum };

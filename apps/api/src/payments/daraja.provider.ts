import { Injectable, ServiceUnavailableException } from '@nestjs/common';

interface StkRequest {
  phone: string;
  amount: number;
  accountReference: string;
  description: string;
}

@Injectable()
export class DarajaProvider {
  private cachedToken?: string;
  private tokenExpiresAt = 0;
  private readonly baseUrl = process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  async initiate(input: StkRequest): Promise<{ merchantRequestId: string; checkoutRequestId: string; responseCode: string }> {
    const { MPESA_SHORTCODE: shortcode, MPESA_PASSKEY: passkey, MPESA_CALLBACK_URL: callbackUrl } = process.env;
    if (!shortcode || !passkey || !callbackUrl) {
      throw new ServiceUnavailableException('M-Pesa is not configured');
    }
    const token = await this.getAccessToken();

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: input.amount,
        PartyA: input.phone,
        PartyB: shortcode,
        PhoneNumber: input.phone,
        CallBackURL: callbackUrl,
        AccountReference: input.accountReference.slice(0, 12),
        TransactionDesc: input.description.slice(0, 13),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json() as {
      MerchantRequestID?: string; CheckoutRequestID?: string; ResponseCode?: string; errorMessage?: string;
    };
    if (!response.ok || !data.MerchantRequestID || !data.CheckoutRequestID || data.ResponseCode !== '0') {
      throw new ServiceUnavailableException(data.errorMessage ?? 'M-Pesa did not accept the payment request');
    }
    return { merchantRequestId: data.MerchantRequestID, checkoutRequestId: data.CheckoutRequestID, responseCode: data.ResponseCode };
  }

  async query(checkoutRequestId: string): Promise<{ resultCode: string; resultDescription: string }> {
    const { MPESA_SHORTCODE: shortcode, MPESA_PASSKEY: passkey } = process.env;
    if (!shortcode || !passkey) throw new ServiceUnavailableException('M-Pesa is not configured');
    const token = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new ServiceUnavailableException('M-Pesa transaction query failed');
    const data = await response.json() as { ResultCode?: string | number; ResultDesc?: string };
    if (data.ResultCode === undefined) throw new ServiceUnavailableException('M-Pesa returned an incomplete transaction query');
    return { resultCode: String(data.ResultCode), resultDescription: data.ResultDesc ?? '' };
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) return this.cachedToken;
    const { MPESA_CONSUMER_KEY: key, MPESA_CONSUMER_SECRET: secret } = process.env;
    if (!key || !secret) throw new ServiceUnavailableException('M-Pesa is not configured');
    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new ServiceUnavailableException('M-Pesa authentication failed');
    const data = await response.json() as { access_token?: string; expires_in?: string | number };
    if (!data.access_token) throw new ServiceUnavailableException('M-Pesa returned no access token');
    const lifetimeSeconds = Number(data.expires_in) || 3_600;
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = Date.now() + Math.max(30, lifetimeSeconds - 60) * 1_000;
    return data.access_token;
  }
}

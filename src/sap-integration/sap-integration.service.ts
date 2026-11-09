import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class SapIntegrationService {
  status() {
    const configured = Boolean(process.env.SAP_BASE_URL && (process.env.SAP_CLIENT_ID || process.env.SAP_COMMUNICATION_USER));
    return {
      mode: process.env.SAP_MODE || 'mock',
      configured,
      baseUrlPresent: Boolean(process.env.SAP_BASE_URL),
      authentication: process.env.SAP_CLIENT_ID ? 'oauth-client-credentials' :
        process.env.SAP_COMMUNICATION_USER ? 'communication-user-basic' : 'not-configured',
      note: 'HAR evidence shows SAP GUI for HTML batch calls, not documented OData business API requests. Live write operations remain disabled until SAP API configuration and field mapping are confirmed.',
    };
  }

  async getAccessToken(): Promise<string> {
    const url = process.env.SAP_TOKEN_URL;
    const id = process.env.SAP_CLIENT_ID;
    const secret = process.env.SAP_CLIENT_SECRET;
    if (!url || !id || !secret) throw new ServiceUnavailableException('SAP OAuth credentials are not configured.');
    const body = new URLSearchParams({ grant_type: 'client_credentials' });
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) throw new ServiceUnavailableException(`SAP token request failed (${response.status}).`);
    const data: any = await response.json();
    return data.access_token;
  }

  async readBillingPdf(billingDocument: string): Promise<Buffer> {
    if ((process.env.SAP_MODE || 'mock') !== 'api') throw new ServiceUnavailableException('SAP_MODE=api is required.');
    const user = process.env.SAP_COMMUNICATION_USER;
    const password = process.env.SAP_COMMUNICATION_PASSWORD;
    if (!user || !password) throw new ServiceUnavailableException('SAP communication-user credentials are not configured for the PDF API.');
    if (!process.env.SAP_BASE_URL) throw new ServiceUnavailableException('SAP_BASE_URL is not configured.');
    const base = process.env.SAP_BASE_URL.replace(/\/$/, '');
    const path = process.env.SAP_BILLING_DOCUMENT_PATH || '/sap/opu/odata/sap/API_BILLING_DOCUMENT_SRV';
    const url = `${base}${path}/Get%20PDF?BillingDocument='${encodeURIComponent(billingDocument)}'`;
    const response = await fetch(url, { headers: { Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`, Accept: 'application/pdf' } });
    if (!response.ok) throw new ServiceUnavailableException(`SAP PDF retrieval failed (${response.status}).`);
    return Buffer.from(await response.arrayBuffer());
  }

  async createOutboundDelivery(): Promise<never> {
    // Intentionally fail closed. The recordings do not reveal the required order schedule-line,
    // shipping point, delivery date, units, or approved API payload. Do not guess a production write.
    throw new ServiceUnavailableException(
      'Live delivery creation is not enabled yet. Confirm SAP API communication arrangement and map sales-order item/schedule-line, shipping point, delivery date, quantities, and custom vehicle fields in a test tenant first.',
    );
  }
}

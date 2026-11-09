import { Injectable, ServiceUnavailableException, BadGatewayException } from '@nestjs/common';

type SandboxJson = Record<string, unknown>;

@Injectable()
export class SapIntegrationService {
  status() {
    const mode = process.env.SAP_MODE || 'mock';
    const sandboxBaseUrl = process.env.SAP_SANDBOX_BASE_URL || 'https://sandbox.api.sap.com';
    const sandboxApiKeyPresent = Boolean(process.env.SAP_SANDBOX_API_KEY);
    const salesOrderPathPresent = Boolean(process.env.SAP_SANDBOX_SALES_ORDER_PATH);
    return {
      mode,
      liveWritesEnabled: false,
      sandbox: {
        baseUrl: sandboxBaseUrl,
        apiKeyConfigured: sandboxApiKeyPresent,
        salesOrderPathConfigured: salesOrderPathPresent,
        readyForReadTests: sandboxApiKeyPresent && salesOrderPathPresent,
      },
      production: {
        configured: false,
        writesEnabled: false,
        note: 'Production connectivity and writes are intentionally not implemented in this sandbox-only phase.',
      },
      note: 'SAP Business Accelerator Hub sandbox uses the personal API key in the APIKey request header. Sandbox data is sample data, not AutoLine tenant data.',
    };
  }

  private sandboxConfig() {
    const baseUrl = process.env.SAP_SANDBOX_BASE_URL || 'https://sandbox.api.sap.com';
    const apiKey = process.env.SAP_SANDBOX_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Configure SAP_SANDBOX_API_KEY from SAP Business Accelerator Hub > Show API Key.');
    }
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== 'https:') {
      throw new ServiceUnavailableException('SAP sandbox base URL must use HTTPS.');
    }
    return { baseUrl: parsed.toString().replace(/\/$/, ''), apiKey };
  }

  private async sandboxGet(path: string, query?: Record<string, string>): Promise<SandboxJson> {
    const { baseUrl, apiKey } = this.sandboxConfig();
    if (!path || !path.startsWith('/') || path.startsWith('//')) {
      throw new ServiceUnavailableException('Configure the exact relative API path copied from the SAP Business Accelerator Hub API details/code snippet.');
    }
    const url = new URL(baseUrl + path);
    for (const [key, value] of Object.entries(query || {})) url.searchParams.set(key, value);

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          APIKey: apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new BadGatewayException('Could not reach the SAP API sandbox. Check the configured sandbox URL and network connectivity.');
    }

    const responseText = await response.text();
    if (!response.ok) {
      // Do not echo SAP response bodies: they may contain sample/customer data or implementation details.
      throw new BadGatewayException(`SAP API sandbox returned HTTP ${response.status} for the configured read operation.`);
    }
    try {
      return responseText ? JSON.parse(responseText) as SandboxJson : {};
    } catch {
      throw new BadGatewayException('SAP API sandbox returned a non-JSON response; verify that the configured operation is an OData/REST JSON endpoint.');
    }
  }

  async readSandboxSalesOrder(salesOrder: string): Promise<SandboxJson> {
    const path = process.env.SAP_SANDBOX_SALES_ORDER_PATH;
    if (!path) {
      throw new ServiceUnavailableException('Configure SAP_SANDBOX_SALES_ORDER_PATH using the exact endpoint path shown in the Sales Order API sandbox/code snippet.');
    }
    const escaped = salesOrder.replace(/'/g, "''");
    return this.sandboxGet(path, { '$filter': `SalesOrder eq '${escaped}'`, '$format': 'json' });
  }

  async readSandboxSalesOrders(top = 10): Promise<SandboxJson> {
    const path = process.env.SAP_SANDBOX_SALES_ORDER_PATH;
    if (!path) {
      throw new ServiceUnavailableException('Configure SAP_SANDBOX_SALES_ORDER_PATH using the exact endpoint path shown in the Sales Order API sandbox/code snippet.');
    }
    const safeTop = Math.min(Math.max(Math.trunc(top), 1), 50);
    return this.sandboxGet(path, { '$top': String(safeTop), '$format': 'json' });
  }

  // No create/update/post operations are exposed in this sandbox-only phase.
}

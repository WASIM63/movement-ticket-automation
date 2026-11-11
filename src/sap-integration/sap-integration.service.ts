import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

type SapJson = Record<string, unknown>;
type SapMethod = 'GET' | 'POST' | 'PATCH';

type SapRequestOptions = {
  method?: SapMethod;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

const PATH_ENV: Record<string, string> = {
  salesOrders: 'SAP_SANDBOX_SALES_ORDER_PATH',
  outboundDeliveries: 'SAP_SANDBOX_OUTBOUND_DELIVERY_PATH',
  billingDocumentsV4: 'SAP_SANDBOX_BILLING_DOCUMENT_V4_PATH',
  billingDocumentsV2: 'SAP_SANDBOX_BILLING_DOCUMENT_V2_PATH',
  electronicDocumentFiles: 'SAP_SANDBOX_ELECTRONIC_DOC_FILE_PATH',
  attachments: 'SAP_SANDBOX_ATTACHMENT_PATH',
};

@Injectable()
export class SapIntegrationService {
  status() {
    const mode = process.env.SAP_MODE || 'sandbox';
    const apiKeyConfigured = Boolean(process.env.SAP_SANDBOX_API_KEY);
    const configuredApis = Object.fromEntries(
      Object.entries(PATH_ENV).map(([name, envName]) => [
        name,
        Boolean(process.env[envName]),
      ]),
    );
    const configuredCount = Object.values(configuredApis).filter(Boolean).length;

    return {
      mode,
      provider: 'SAP Business Accelerator Hub sandbox',
      sandbox: {
        baseUrl: process.env.SAP_SANDBOX_BASE_URL || 'https://sandbox.api.sap.com',
        apiKeyConfigured,
        configuredApis,
        configuredApiCount: configuredCount,
        readyForReadTests: apiKeyConfigured && configuredCount > 0,
        writesEnabled: process.env.SAP_SANDBOX_ALLOW_WRITES === 'true',
      },
      production: {
        configured: false,
        writesEnabled: false,
        note: 'Production tenant connectivity and writes are intentionally disabled.',
      },
      note: 'Hub sandbox sample data is not AutoLine tenant data. Only operations explicitly supported by the selected sandbox API can be tested here.',
    };
  }

  private config() {
    const baseUrl = process.env.SAP_SANDBOX_BASE_URL || 'https://sandbox.api.sap.com';
    const apiKey = process.env.SAP_SANDBOX_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Configure SAP_SANDBOX_API_KEY locally from SAP Business Accelerator Hub. Never send the key in chat or commit it.',
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch {
      throw new ServiceUnavailableException('SAP_SANDBOX_BASE_URL is not a valid URL.');
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'sandbox.api.sap.com') {
      throw new ServiceUnavailableException(
        'Sandbox requests are restricted to HTTPS sandbox.api.sap.com. Production tenant URLs are not accepted.',
      );
    }
    return { baseUrl: parsed.toString().replace(/\/$/, ''), apiKey };
  }

  private configuredPath(envName: string, required = true): string | undefined {
    const path = process.env[envName]?.trim();
    if (!path) {
      if (!required) return undefined;
      throw new ServiceUnavailableException(
        `Configure ${envName} using the exact relative path from that API's SAP Business Accelerator Hub code snippet.`,
      );
    }
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
      throw new ServiceUnavailableException(`${envName} must be a relative path beginning with one slash.`);
    }
    return path;
  }

  private async request(path: string, options: SapRequestOptions = {}): Promise<unknown> {
    const { baseUrl, apiKey } = this.config();
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
      throw new ServiceUnavailableException('SAP API path must be a relative path on the configured sandbox host.');
    }

    const url = new URL(baseUrl + path);
    for (const [key, value] of Object.entries(options.query || {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const method = options.method || 'GET';
    if (method !== 'GET' && process.env.SAP_SANDBOX_ALLOW_WRITES !== 'true') {
      throw new ServiceUnavailableException(
        'Sandbox writes are disabled. Enable SAP_SANDBOX_ALLOW_WRITES=true only after confirming that this exact operation is supported by the Hub sandbox.',
      );
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          APIKey: apiKey,
          Accept: 'application/json',
          ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(options.headers || {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new BadGatewayException('Could not reach the SAP Business Accelerator Hub sandbox. Check network connectivity and the configured API path.');
    }

    const text = await response.text();
    if (!response.ok) {
      // Avoid returning upstream payloads: they can contain sensitive sample data and implementation details.
      throw new BadGatewayException(`SAP sandbox returned HTTP ${response.status} for ${method} ${path.split('?')[0]}.`);
    }
    if (!text) return {};
    try {
      return JSON.parse(text) as SapJson;
    } catch {
      return { rawText: text, contentType: response.headers.get('content-type') || 'text/plain' };
    }
  }

  private async readApi(envName: string, query?: Record<string, string | number | undefined>) {
    const path = this.configuredPath(envName)!;
    return this.request(path, { query });
  }

  async readSandboxSalesOrders(top = 10) {
    const safeTop = Math.min(Math.max(Math.trunc(top), 1), 50);
    return this.readApi(PATH_ENV.salesOrders, { '$top': safeTop, '$format': 'json' });
  }

  async readSandboxSalesOrder(salesOrder: string) {
    const template = this.configuredPath(PATH_ENV.salesOrders)!;
    const keyPath = process.env.SAP_SANDBOX_SALES_ORDER_KEY_PATH?.trim();
    if (!keyPath) {
      throw new ServiceUnavailableException(
        'Set SAP_SANDBOX_SALES_ORDER_KEY_PATH to the exact entity-key path template from the API specification, using {salesOrder} as the placeholder. No entity/property name is guessed.',
      );
    }
    const path = keyPath.replace('{salesOrder}', encodeURIComponent(salesOrder));
    if (path === keyPath) {
      throw new ServiceUnavailableException('Sales order key path must contain the {salesOrder} placeholder.');
    }
    // The collection path must be configured too; this catches accidental configuration of a different API.
    void template;
    return this.request(path, { query: { '$format': 'json' } });
  }

  async readSandboxOutboundDeliveries(top = 10) {
    return this.readApi(PATH_ENV.outboundDeliveries, {
      '$top': Math.min(Math.max(Math.trunc(top), 1), 50),
      '$format': 'json',
    });
  }

  async readSandboxBillingDocumentsV4(top = 10) {
    return this.readApi(PATH_ENV.billingDocumentsV4, {
      '$top': Math.min(Math.max(Math.trunc(top), 1), 50),
    });
  }

  async readSandboxBillingDocumentsV2(top = 10) {
    return this.readApi(PATH_ENV.billingDocumentsV2, {
      '$top': Math.min(Math.max(Math.trunc(top), 1), 50),
      '$format': 'json',
    });
  }

  async readSandboxElectronicDocumentFiles(top = 10) {
    return this.readApi(PATH_ENV.electronicDocumentFiles, {
      '$top': Math.min(Math.max(Math.trunc(top), 1), 50),
    });
  }

  async readSandboxAttachments(top = 10) {
    return this.readApi(PATH_ENV.attachments, {
      '$top': Math.min(Math.max(Math.trunc(top), 1), 50),
      '$format': 'json',
    });
  }

  /**
   * Generic sandbox operation adapter. The exact path and payload must come from
   * the selected API's official specification / sandbox code sample. No SAP
   * entity names, function imports, or payload properties are synthesized here.
   */
  async executeConfiguredSandboxOperation(
    operation: string,
    method: SapMethod,
    body?: unknown,
  ) {
    if (!['POST', 'PATCH'].includes(method)) {
      throw new ServiceUnavailableException('Only POST and PATCH are accepted by this operation route.');
    }
    const allowed: Record<string, string> = {
      createOutboundDelivery: 'SAP_SANDBOX_CREATE_DELIVERY_PATH',
      updatePicking: 'SAP_SANDBOX_UPDATE_PICKING_PATH',
      updateDeliveryFields: 'SAP_SANDBOX_UPDATE_DELIVERY_PATH',
      createBillingDocument: 'SAP_SANDBOX_CREATE_BILLING_PATH',
      updateBillingDocument: 'SAP_SANDBOX_UPDATE_BILLING_PATH',
      updateElectronicDocument: 'SAP_SANDBOX_UPDATE_ELECTRONIC_DOC_PATH',
    };
    const envName = allowed[operation];
    if (!envName) throw new ServiceUnavailableException('Unknown or unsupported sandbox operation.');
    const path = this.configuredPath(envName)!;
    return this.request(path, { method, body });
  }
}

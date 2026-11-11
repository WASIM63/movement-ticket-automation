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

const DEFAULT_PATHS: Record<string, string> = {
  SAP_SANDBOX_SALES_ORDER_PATH: '/s4hanacloud/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder',
  SAP_SANDBOX_SALES_ORDER_KEY_PATH: "/s4hanacloud/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder('{salesOrder}')",
  SAP_SANDBOX_OUTBOUND_DELIVERY_PATH: '/s4hanacloud/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader',
  SAP_SANDBOX_BILLING_DOCUMENT_V4_PATH: '/s4hanacloud/sap/opu/odata4/sap/api_billingdocument/srvd_a2x/sap/billingdocument/0001/BillingDocument',
  SAP_SANDBOX_BILLING_DOCUMENT_V2_PATH: '/s4hanacloud/sap/opu/odata/sap/API_BILLING_DOCUMENT_SRV/A_BillingDocument',
  SAP_SANDBOX_BILLING_PDF_PATH: "/s4hanacloud/sap/opu/odata/sap/API_BILLING_DOCUMENT_SRV/Get%20PDF?BillingDocument='{billingDocument}'",
  SAP_SANDBOX_CREATE_DELIVERY_PATH: '/s4hanacloud/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader',
  SAP_SANDBOX_UPDATE_PICKING_PATH: "/s4hanacloud/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=2/SetPickingQuantityWithBaseQuantity?DeliveryDocument='{DeliveryDocument}'&DeliveryDocumentItem='{DeliveryDocumentItem}'&ActualDeliveredQtyInBaseUnit={ActualDeliveredQtyInBaseUnit}&BaseUnit='{BaseUnit}'",
  SAP_SANDBOX_CREATE_BILLING_PATH: '/s4hanacloud/sap/opu/odata4/sap/api_billingdocument/srvd_a2x/sap/billingdocument/0001/BillingDocument/SAP__self.CreateFromSDDocument',
};

const PATH_ENV: Record<string, string> = {
  salesOrders: 'SAP_SANDBOX_SALES_ORDER_PATH',
  outboundDeliveries: 'SAP_SANDBOX_OUTBOUND_DELIVERY_PATH',
  billingDocumentsV4: 'SAP_SANDBOX_BILLING_DOCUMENT_V4_PATH',
  billingDocumentsV2: 'SAP_SANDBOX_BILLING_DOCUMENT_V2_PATH',
  electronicDocumentFiles: 'SAP_SANDBOX_ELECTRONIC_DOC_FILE_PATH',
  billingPdf: 'SAP_SANDBOX_BILLING_PDF_PATH',
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
        Boolean(process.env[envName] || DEFAULT_PATHS[envName]),
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
    if ((process.env.SAP_MODE || 'sandbox') !== 'sandbox') {
      throw new ServiceUnavailableException('This SAP adapter only runs in SAP_MODE=sandbox. Production mode is not supported.');
    }
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
    const path = (process.env[envName] || DEFAULT_PATHS[envName])?.trim();
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
          ...(options.body === undefined || options.body === null ? {} : { 'Content-Type': 'application/json' }),
          ...(options.headers || {}),
        },
        body: options.body === undefined || options.body === null ? undefined : JSON.stringify(options.body),
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

  async testSandboxReadApis() {
    const checks: Array<{ name: string; env: string; query?: Record<string, string | number | undefined> }> = [
      { name: 'Sales Order OData V2', env: PATH_ENV.salesOrders, query: { '$top': 1, '$format': 'json' } },
      { name: 'Outbound Delivery OData V2', env: PATH_ENV.outboundDeliveries, query: { '$top': 1, '$format': 'json' } },
      { name: 'Billing Document OData V4', env: PATH_ENV.billingDocumentsV4, query: { '$top': 1 } },
      { name: 'Billing Document OData V2', env: PATH_ENV.billingDocumentsV2, query: { '$top': 1, '$format': 'json' } },
      { name: 'Electronic Document File OData V4', env: PATH_ENV.electronicDocumentFiles, query: { '$top': 1 } },
      { name: 'Attachment API', env: PATH_ENV.attachments, query: { '$top': 1, '$format': 'json' } },
    ];
    const results: Array<{ api: string; status: string; message: string }> = [];
    for (const check of checks) {
      const path = this.configuredPath(check.env, false);
      if (!path) {
        results.push({ api: check.name, status: 'not_configured', message: `Set ${check.env} after verifying the API sandbox path.` });
        continue;
      }
      try {
        await this.request(path, { query: check.query });
        results.push({ api: check.name, status: 'reachable', message: 'Sandbox returned a successful response.' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sandbox request failed.';
        results.push({ api: check.name, status: 'failed', message });
      }
    }
    return {
      mode: 'sandbox',
      productionTouched: false,
      checks: results,
      note: 'A successful GET proves sandbox reachability only; it does not prove AutoLine tenant entitlement or write-operation support.',
    };
  }

  async readSandboxSalesOrders(top = 10, filter?: string) {
    const safeTop = Math.min(Math.max(Math.trunc(top), 1), 50);
    return this.readApi(PATH_ENV.salesOrders, { '$top': safeTop, '$format': 'json', '$filter': filter });
  }

  async readSandboxSalesOrder(salesOrder: string) {
    const keyPath = (process.env.SAP_SANDBOX_SALES_ORDER_KEY_PATH || DEFAULT_PATHS.SAP_SANDBOX_SALES_ORDER_KEY_PATH).trim();
    if (!keyPath) {
      throw new ServiceUnavailableException(
        'Set SAP_SANDBOX_SALES_ORDER_KEY_PATH to the exact entity-key path template from the API specification, using {salesOrder} as the placeholder. No entity/property name is guessed.',
      );
    }
    const path = keyPath.replace('{salesOrder}', encodeURIComponent(salesOrder));
    if (path === keyPath) {
      throw new ServiceUnavailableException('Sales order key path must contain the {salesOrder} placeholder.');
    }
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

  async readSandboxBillingPdf(billingDocument: string) {
    const template = this.configuredPath('SAP_SANDBOX_BILLING_PDF_PATH')!;
    if (!template.includes('{billingDocument}')) {
      throw new ServiceUnavailableException(
        'SAP_SANDBOX_BILLING_PDF_PATH must contain the {billingDocument} placeholder and match the API GetPDF operation from its official specification.',
      );
    }
    const path = template.replace('{billingDocument}', encodeURIComponent(billingDocument));
    const { baseUrl, apiKey } = this.config();
    const url = new URL(baseUrl + path);
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { APIKey: apiKey, Accept: 'application/pdf, application/json' },
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new BadGatewayException('Could not reach the SAP sandbox PDF operation.');
    }
    if (!response.ok) {
      throw new BadGatewayException(`SAP sandbox returned HTTP ${response.status} for the configured billing PDF operation.`);
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (contentType.includes('json')) {
      const result = await response.json() as { BillingDocumentBinary?: string; d?: { BillingDocumentBinary?: string } };
      const encoded = result.BillingDocumentBinary || result.d?.BillingDocumentBinary;
      if (!encoded) {
        throw new BadGatewayException('SAP GetPDF response did not contain BillingDocumentBinary.');
      }
      const bytes = Buffer.from(encoded, 'base64');
      return { contentType: 'application/pdf', data: bytes.toString('base64'), size: bytes.length };
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return { contentType, data: bytes.toString('base64'), size: bytes.length };
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
    const allowed: Record<string, { env: string; method: SapMethod }> = {
      createOutboundDelivery: { env: 'SAP_SANDBOX_CREATE_DELIVERY_PATH', method: 'POST' },
      updatePicking: { env: 'SAP_SANDBOX_UPDATE_PICKING_PATH', method: 'POST' },
      updateDeliveryFields: { env: 'SAP_SANDBOX_UPDATE_DELIVERY_PATH', method: 'PATCH' },
      createBillingDocument: { env: 'SAP_SANDBOX_CREATE_BILLING_PATH', method: 'POST' },
      updateBillingDocument: { env: 'SAP_SANDBOX_UPDATE_BILLING_PATH', method: 'PATCH' },
      updateElectronicDocument: { env: 'SAP_SANDBOX_UPDATE_ELECTRONIC_DOC_PATH', method: 'PATCH' },
    };
    const definition = allowed[operation];
    if (!definition || definition.method !== method) {
      throw new ServiceUnavailableException('Unknown operation or HTTP method does not match the configured operation contract.');
    }
    let path = this.configuredPath(definition.env)!;
    const envelope = body && typeof body === 'object' ? body as { parameters?: Record<string, string | number>; payload?: unknown; headers?: { ifMatch?: string; csrfToken?: string } } : undefined;
    if (envelope?.parameters) {
      for (const [name, value] of Object.entries(envelope.parameters)) {
        path = path.replaceAll(`{${name}}`, encodeURIComponent(String(value)));
      }
    }
    if (/\{[A-Za-z0-9_]+\}/.test(path)) {
      throw new ServiceUnavailableException('The configured operation path contains unresolved parameters. Supply matching values in the parameters object.');
    }
    const requestBody = envelope && Object.prototype.hasOwnProperty.call(envelope, 'payload') ? envelope.payload : envelope?.parameters ? undefined : body;
    const headers: Record<string, string> = {};
    if (envelope?.headers?.ifMatch) headers['If-Match'] = envelope.headers.ifMatch;
    if (envelope?.headers?.csrfToken) headers['X-CSRF-Token'] = envelope.headers.csrfToken;
    return this.request(path, { method, body: requestBody, headers });
  }
}

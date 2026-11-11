# 10 — SAP Business Accelerator Hub sandbox implementation

## Scope
This phase is strictly limited to SAP Business Accelerator Hub sandbox access. It does not connect to AutoLine's S/4HANA tenant and does not create or change business documents.

## Official SAP sandbox behavior
- The Hub sandbox is a test environment using sample data.
- Each logged-in Hub user has a personalized API key.
- The Hub's Try Out UI passes the key internally. External clients must send it in the `APIKey` HTTP header.
- Try Out is unavailable for SOAP APIs, GraphQL APIs, Service Programming Interfaces and Delta Sharing APIs.
- Productive API use requires the applicable product license.

Official SAP references:
- https://help.sap.com/docs/business-accelerator-hub/sap-business-accelerator-hub/trying-out-apis-in-sandbox-environment
- https://help.sap.com/docs/business-accelerator-hub/sap-business-accelerator-hub/trying-out-apis
- https://help.sap.com/docs/sap_s4hana_cloud/0f69f8fb28ac4bf48d2b57b9637e81fa/1e60f14bdc224c2c975c8fa8bcfd7f3f.html

## Implemented in this phase
- `SAP_MODE=sandbox` is the documented local mode.
- Sandbox base URL defaults to `https://sandbox.api.sap.com`.
- Personal Hub API key is read from `SAP_SANDBOX_API_KEY`.
- Read-only sales-order routes:
  - `GET /api/sap/sandbox/status`
  - `GET /api/sap/sandbox/sales-orders?top=10`
  - `GET /api/sap/sandbox/sales-orders/:salesOrder`
- Exact service-relative path is configurable as `SAP_SANDBOX_SALES_ORDER_PATH`; copy it from the Sales Order API's own sandbox code snippet/API details. No unverified service path is hard-coded.
- API errors are normalized without echoing response bodies or credentials.
- No sandbox create/update/delete/post routes exist.

## Local configuration
1. Copy `.env.example` to `.env`.
2. Sign in to https://api.sap.com/.
3. Open an OData/REST Sales Order API that has Sandbox / Try Out support.
4. Run its GET operation in Try Out and confirm a sample response.
5. Choose Show API Key and put the key in local `SAP_SANDBOX_API_KEY`. Never commit it.
6. From the API's Code Snippet, copy the exact sandbox base URL and relative resource path into `SAP_SANDBOX_BASE_URL` and `SAP_SANDBOX_SALES_ORDER_PATH`.
7. Start the app and test the read-only routes.

## Limitations
- Sandbox sample data is not AutoLine's sales order data.
- The Outbound Delivery with Reference to a Sales Order – Create (A2X) card shown by the user is SOAP. SAP Help says SOAP APIs cannot be tried out in the Hub sandbox. This sandbox-only phase therefore cannot validate that create operation through Hub Try Out.
- AI-generated sandbox responses are illustrative mock responses and must not be treated as live API behavior.
- Billing, picking, goods issue, eDocument/e-way bill and invoice PDF operations are not enabled until each chosen API's sandbox support, exact endpoint, schema and successful sample response are verified.
- Production/company-tenant credentials, communication arrangements and write operations remain out of scope.

## Acceptance checks
- Missing API key returns a clear configuration error.
- Missing endpoint path returns a clear configuration error.
- Status endpoint never reveals the API key.
- Read routes use GET only and send the APIKey header.
- No write operation is exposed by the sandbox controller.
- No live SAP operation is reported as successful without a real SAP response.


## Current adapter status
The initial read-only Sales Order implementation described above has been expanded. See `docs/11-sap-sandbox-odata-adapter.md` for the current configurable OData V2/V4 sandbox routes. That adapter includes guarded POST/PATCH request forwarding, but no write is enabled by default and no endpoint or payload is inferred. The API key alone is not enough: each API's exact sandbox resource path and each write operation's exact schema must also be configured from the corresponding official SAP API specification/code snippet.

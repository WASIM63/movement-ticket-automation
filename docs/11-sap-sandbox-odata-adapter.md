# 11 — SAP sandbox OData integration adapter

## What changed
The SAP integration module now provides a sandbox-only OData adapter with:
- APIKey header authentication for SAP Business Accelerator Hub.
- HTTPS host allow-list restricted to `sandbox.api.sap.com`.
- Configurable resource paths copied from each API's own SAP Business Accelerator Hub code snippet.
- Read routes for Sales Orders, Outbound Deliveries, Billing Documents V2/V4, Electronic Document Files and Attachments.
- Guarded POST/PATCH adapter routes for delivery creation, picking, delivery fields, billing creation/updates and electronic-document updates.
- A fail-closed write switch. Writes remain disabled unless `SAP_SANDBOX_ALLOW_WRITES=true`.
- Normalized upstream errors that do not echo upstream response bodies or credentials.

## Important boundary
This is an integration adapter, not proof that all operations are available in the Hub sandbox. SAP API catalog documentation, Hub sandbox availability and AutoLine tenant entitlement are separate facts.

No endpoint path, entity key, function/action name, custom field, or request body is guessed. Every path must be copied from the exact API specification/code snippet. The caller supplies the operation body based on the documented schema.

The API Hub sandbox may not offer write support for every API. If a configured operation is not supported by the selected sandbox, keep it disabled and record the limitation. Do not switch to the AutoLine production tenant.

## Built-in documented resource paths
The adapter has default paths for the documented SAP S/4HANA Cloud services below. Each can be overridden in the local `.env` if the Hub's current code snippet differs:
- Sales Order V2: `/s4hanacloud/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder`
- Sales Order key lookup: `/s4hanacloud/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder('{salesOrder}')`
- Outbound Delivery V2: `/s4hanacloud/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader`
- Picking: `SetPickingQuantityWithBaseQuantity` function import on the same V2 service, with delivery/item/quantity/unit parameters.
- Billing Document V4: `/s4hanacloud/sap/opu/odata4/sap/api_billingdocument/srvd_a2x/sap/billingdocument/0001/BillingDocument`
- Billing creation: `BillingDocument/SAP__self.CreateFromSDDocument` on the same V4 service.
- Billing Document V2: `/s4hanacloud/sap/opu/odata/sap/API_BILLING_DOCUMENT_SRV/A_BillingDocument`
- Billing PDF: `Get PDF?BillingDocument='{billingDocument}'` on the same V2 service.

These paths are based on SAP's published service examples. Their availability and supported operations in the Hub sandbox must still be tested with the user's API key. The Electronic Document Cockpit fields and attachment list do not yet have a confirmed mapping to these services.

Official operation references:
- Sales Order sandbox base path example: https://learning.sap.com/courses/developing-with-sap-build-process-automation/encapsulating-the-apis-of-remote-systems-using-actions-projects_d102638b-94d7-4c2e-9547-bb344e9aa9de
- Outbound Delivery create: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/2f36056ae9a044bba55bcbad204b7bc5/ab6845012ee148ba9c2694648c2a0685.html
- Outbound Delivery read: https://help.sap.com/docs/PRODUCT_ID/588780cab2774a7ab9fffca3a7f919fe/364944fb5b1246c7b4de26401b5f1f82.html
- Picking quantity: https://help.sap.com/docs/SAP_S4HANA_CLOUD/588780cab2774a7ab9fffca3a7f919fe/66c9866e4ab947aa8297d1083ec52643.html
- Billing Document create: https://help.sap.com/docs/SAP_S4HANA_CLOUD/03c04db2a7434731b7fe21dca77440da/6b2add771a454ac889eddd2b6fa4301c.html
- Billing Document read/PDF: https://help.sap.com/docs/SAP_S4HANA_CLOUD/03c04db2a7434731b7fe21dca77440da/a9120b013c9a44efaf417e1a66704901.html

## Local configuration
Copy the values below into the local `.env` (not GitHub). The API key must never be shared in chat or committed.

```env
SAP_MODE=sandbox
SAP_SANDBOX_BASE_URL=https://sandbox.api.sap.com
SAP_SANDBOX_API_KEY=

# These six paths have built-in defaults; override only if the Hub code snippet differs.
SAP_SANDBOX_SALES_ORDER_PATH=
SAP_SANDBOX_SALES_ORDER_KEY_PATH=
SAP_SANDBOX_OUTBOUND_DELIVERY_PATH=
SAP_SANDBOX_BILLING_DOCUMENT_V4_PATH=
SAP_SANDBOX_BILLING_DOCUMENT_V2_PATH=
SAP_SANDBOX_BILLING_PDF_PATH=
SAP_SANDBOX_ELECTRONIC_DOC_FILE_PATH=
SAP_SANDBOX_ATTACHMENT_PATH=

SAP_SANDBOX_CREATE_DELIVERY_PATH=
SAP_SANDBOX_UPDATE_PICKING_PATH=
SAP_SANDBOX_UPDATE_DELIVERY_PATH=
SAP_SANDBOX_CREATE_BILLING_PATH=
SAP_SANDBOX_UPDATE_BILLING_PATH=
SAP_SANDBOX_UPDATE_ELECTRONIC_DOC_PATH=

SAP_SANDBOX_ALLOW_WRITES=false
```

For the sales-order detail lookup, `SAP_SANDBOX_SALES_ORDER_KEY_PATH` must be the exact entity key path from the Sales Order API specification and contain the literal placeholder `{salesOrder}`. Example shape only: `/service-root/EntitySet(''{salesOrder}'')`; replace it with the actual API path and key syntax.

## Routes
- `GET /api/sap/status`
- `GET /api/sap/sandbox/status`
- `GET /api/sap/sandbox/test-reads` (runs sequential GET connectivity checks for configured read APIs)
- `GET /api/sap/sandbox/sales-orders?top=10`
- `GET /api/sap/sandbox/sales-orders/:salesOrder`
- `GET /api/sap/sandbox/outbound-deliveries?top=10`
- `GET /api/sap/sandbox/billing-documents/v4?top=10`
- `GET /api/sap/sandbox/billing-documents/v2?top=10`
- `GET /api/sap/sandbox/billing-documents/:billingDocument/pdf` (returns base64 PDF data and content type)
- `GET /api/sap/sandbox/electronic-document-files?top=10`
- `GET /api/sap/sandbox/attachments?top=10`
- `POST /api/sap/sandbox/operations/createOutboundDelivery`
- `POST /api/sap/sandbox/operations/updatePicking`
- `PATCH /api/sap/sandbox/operations/updateDeliveryFields`
- `POST /api/sap/sandbox/operations/createBillingDocument`
- `PATCH /api/sap/sandbox/operations/updateBillingDocument`
- `PATCH /api/sap/sandbox/operations/updateElectronicDocument`

The POST/PATCH routes are disabled by default. Delivery creation, picking and Billing V4 creation have documented default paths; other writes require their operation-specific path variables. Send a JSON envelope with `parameters` for URL/action parameters, optional `payload` for the OData JSON body, and optional `headers.ifMatch` / `headers.csrfToken` for APIs that require concurrency/CSRF headers. Example shape only: `{ "parameters": { "DeliveryDocument": "...", "DeliveryDocumentItem": "...", "ActualDeliveredQtyInBaseUnit": "...", "BaseUnit": "..." } }`. Use the exact property names and values from the official API schema. The adapter does not manufacture SAP payloads.

## Recommended test order
1. Configure the API key locally and one read resource path.
2. Call `GET /api/sap/sandbox/status`.
3. Call `GET /api/sap/sandbox/test-reads` to test all configured read APIs without returning their sample data.
4. Test Sales Order GET and inspect the exact response shape.
5. Configure and test optional Electronic Document and Attachment GET resources individually.
6. For each write operation, first confirm that the Hub sandbox supports it, copy the exact endpoint/action and schema, and use only sample data. Enable the write switch only for that test session.
7. Record actual request/response and outcome in a redacted test report.
8. Never configure the production AutoLine tenant in this sandbox adapter.

## Not implemented / not claimed
- Full Electronic Document Cockpit automation. The recording shows opening a details dialog and saving/confirming it; the exact released OData API/action and field mapping remain unverified.
- Silent physical printing. This needs an office-side print agent and a printer acknowledgement protocol.
- Production communication arrangements, OAuth credentials, CSRF/ETag handling for the AutoLine tenant, or production writes.
- Billing-due list selection API. Its exact released OData service/operation still needs confirmation.

## Validation status
Code changes were committed to `main`. The GitHub connector does not execute the repository's Node build or tests, and no sandbox API key has been configured in this repository. Therefore TypeScript build, sandbox connectivity and API operations remain untested until run in the user's local environment.

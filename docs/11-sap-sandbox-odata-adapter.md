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

## Local configuration
Copy the values below into the local `.env` (not GitHub). The API key must never be shared in chat or committed.

```env
SAP_MODE=sandbox
SAP_SANDBOX_BASE_URL=https://sandbox.api.sap.com
SAP_SANDBOX_API_KEY=

SAP_SANDBOX_SALES_ORDER_PATH=
SAP_SANDBOX_SALES_ORDER_KEY_PATH=
SAP_SANDBOX_OUTBOUND_DELIVERY_PATH=
SAP_SANDBOX_BILLING_DOCUMENT_V4_PATH=
SAP_SANDBOX_BILLING_DOCUMENT_V2_PATH=
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
- `GET /api/sap/sandbox/sales-orders?top=10`
- `GET /api/sap/sandbox/sales-orders/:salesOrder`
- `GET /api/sap/sandbox/outbound-deliveries?top=10`
- `GET /api/sap/sandbox/billing-documents/v4?top=10`
- `GET /api/sap/sandbox/billing-documents/v2?top=10`
- `GET /api/sap/sandbox/electronic-document-files?top=10`
- `GET /api/sap/sandbox/attachments?top=10`
- `POST /api/sap/sandbox/operations/createOutboundDelivery`
- `POST /api/sap/sandbox/operations/updatePicking`
- `PATCH /api/sap/sandbox/operations/updateDeliveryFields`
- `POST /api/sap/sandbox/operations/createBillingDocument`
- `PATCH /api/sap/sandbox/operations/updateBillingDocument`
- `PATCH /api/sap/sandbox/operations/updateElectronicDocument`

The POST/PATCH routes are disabled by default and also require their operation-specific path variables. They are generic request adapters; they do not manufacture SAP payloads.

## Recommended test order
1. Configure the API key locally and one read resource path.
2. Call `GET /api/sap/sandbox/status`.
3. Test Sales Order GET and inspect the exact response shape.
4. Configure and test the other GET resources individually.
5. For each write operation, first confirm that the Hub sandbox supports it, copy the exact endpoint/action and schema, and use only sample data. Enable the write switch only for that test session.
6. Record actual request/response and outcome in a redacted test report.
7. Never configure the production AutoLine tenant in this sandbox adapter.

## Not implemented / not claimed
- Full Electronic Document Cockpit automation. The recording shows opening a details dialog and saving/confirming it; the exact released OData API/action and field mapping remain unverified.
- Silent physical printing. This needs an office-side print agent and a printer acknowledgement protocol.
- Production communication arrangements, OAuth credentials, CSRF/ETag handling for the AutoLine tenant, or production writes.
- Billing-due list selection API. Its exact released OData service/operation still needs confirmation.

## Validation status
Code changes were committed to `main`. The GitHub connector does not execute the repository's Node build or tests, and no sandbox API key has been configured in this repository. Therefore TypeScript build, sandbox connectivity and API operations remain untested until run in the user's local environment.

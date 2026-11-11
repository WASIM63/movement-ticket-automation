# 12 — SAP sandbox workflow workbench

## Implemented
Each movement-ticket detail page now links to a per-ticket SAP workflow workbench at:

`/movement-tickets/:id/workflow`

The workbench currently provides these sandbox read/retrieval steps:
1. Read a sales order by the order number saved on the movement ticket (editable in the workbench for lookup).
2. Read the first 10 outbound delivery records.
3. Read the first 10 billing document records from OData V4.
4. Read the first 10 billing document records from OData V2.
5. Open an invoice PDF in the browser using a billing document number returned by SAP.

The invoice binary route is:
`GET /api/sap/sandbox/billing-documents/:billingDocument/pdf/file`

It uses the existing configured Get PDF adapter, decodes the returned base64 PDF and responds with `application/pdf` for browser viewing/printing. The existing JSON/base64 PDF route remains available.

## Safety boundary
- The workbench only invokes GET/read operations.
- It does not create an outbound delivery, change picking, post goods issue, create/update billing, update India e-way bill details, or modify AutoLine production.
- The existing guarded operation adapter remains separate and writes stay disabled by default.
- Hub sample records are not AutoLine business records. Do not use sandbox document IDs in the production tenant.
- The workbench does not mark a ticket SAP-complete or printed based on a read response.
- SAP document references are not automatically persisted to a ticket in this phase.

## Remaining work requiring verified contracts
1. Delivery creation: confirm Hub sandbox write support and the complete request schema, including sales order item/schedule line and shipping data.
2. Picking: verify action path, units, ETag and CSRF requirements using a sample delivery.
3. Goods issue: verify the process gate and actual dispatch confirmation. Never post GI merely to make billing available.
4. Vehicle/transport fields: obtain the technical custom-field names and supported update API.
5. Billing: verify the billing-due selection process and exact CreateFromSDDocument request/response.
6. India e-way bill: obtain the SAP Integration Suite/GSP integration contract; no generic OData update path is configured.
7. Attachments: verify the Hub proxy service path, metadata response, business-object type/key and content download operation.
8. Printing: implement an approved office-side print agent and record printer acknowledgement separately from PDF retrieval.

## Local verification
After pulling main and configuring the local sandbox API key:
- Open a saved ticket and click **SAP workflow**.
- Try each read action and inspect the response viewer.
- Use an actual billing document number from the sandbox response to open the PDF.
- Check that the browser receives a PDF response; PDF availability depends on the sample billing document and Hub API support.

The GitHub file editor does not run npm build, Jest, Prisma migrations, or browser tests. Those remain local verification steps.

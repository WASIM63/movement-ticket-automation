# 09 — 1-second screen-recording audit (2026-11-05)

## Source and review method
- Source: user-supplied 200.27-second screen recording.
- Reviewed at 1 frame per second (approximately 200 frames), arranged into sequential contact sheets.
- This is a visual audit, not a substitute for SAP API request/response evidence. Small UI labels and generated identifiers are not reliably legible; no uncertain value is promoted to a required production field.

## Confirmed screen/application sequence

The recording shows several SAP Fiori / SAP GUI for HTML applications:

1. **Create Outbound Delivery with Order Reference** — initial selection screen, sales-order lookup/value help, then delivery item overview.
2. **Outbound Delivery details** — item overview with tabs including Processing, Picking, Loading, Shipment, Warehouse/Status, and custom/header-related tabs. Picking quantities are edited in the item grid.
3. **Custom/header data** — a custom field area is opened and a vehicle registration is entered. Dropdown/value-help interactions are visible. Exact technical field IDs are not established.
4. **Create Billing Document** — a billing-due/document selection screen is opened and a reference row is selected/processed.
5. **Electronic Document Cockpit** — a document row is selected and an e-way-bill-related details dialog is opened. The dialog contains transport/document details and value-help dropdowns; it is saved/confirmed.
6. **Change Billing Document** — a billing document is opened, the item overview is displayed, and an attachment/service attachment list is opened. Attachment rows are visible, but actual PDF bytes and final print operation are not proven by the video.
7. **Second outbound delivery / second invoice pass** — the recording returns to outbound-delivery creation and repeats order lookup, delivery item processing, picking and custom/header-data steps. The later billing/change/attachment steps indicate a second invoice flow is intended.

## What the 1-second review adds versus the earlier 5-second review
- The workflow has multiple distinct navigation/application transitions and modal dialogs; 5-second sampling can miss dropdown selection, row selection, save confirmation, and attachment dialogs.
- Electronic Document Cockpit is a separate stage between billing creation and billing-document change/attachment handling.
- VF02 is used to inspect/change a billing document and access its service/attachment list; the recording does not prove that VF02 itself creates the invoice.
- The workflow appears to process two separate delivery/invoice cases, not one delivery with two invoice rows. Confirm against generated document numbers and source sales orders.
- Value-help lists and modal form interactions are material steps and must not be collapsed into a generic “fill transport details” action.

## Values already supported by the HAR audit (not universal defaults)
- Sales order search value observed: 264O001261 (the character at the O/zero position is ambiguous).
- Picking quantity values observed in separate captures: 24 and 34.
- Vehicle registration observed: GJ01KT4011.
- E-document/transport form values observed: vendor type 2, transport mode 1, vehicle type R, distance 5.
- Billing reference lookup observed: 80555698.
These are sample values from one recorded run, not hard-coded configuration or defaults.

## Generated numbers / identifiers
The recording and currently audited HAR excerpts do not provide a trustworthy, complete mapping of:
- source sales order → created outbound delivery number;
- outbound delivery → picking confirmation / goods issue material document number;
- billing-due selection → first billing document number;
- second source order/delivery → second billing document number;
- e-way bill / electronic document number and status;
- attachment identifier → actual invoice PDF.

The application must capture these returned identifiers from SAP API responses and persist them against the movement ticket. It must never manufacture or infer a SAP document number from the screen, timestamp, or local ticket number.

## API implementation mapping (to be verified against AutoLine tenant)
| Recorded stage | Preferred integration | Evidence still required |
|---|---|---|
| Search sales order | Released Sales Order API or supported outbound-delivery API reference lookup | API entitlement, communication arrangement, exact sales-order API/read scope |
| Create outbound delivery | Outbound Delivery API (A2X / API_OUTBOUND_DELIVERY_SRV) | Exact operation/version, order item + schedule line, shipping point, plant/storage location, requested qty and delivery date |
| Edit picking | Outbound Delivery API operation if supported for this delivery/process | Supported entity/action and sample successful test response |
| Goods issue | Released delivery processing operation/API | Exact operation and business preconditions |
| Create invoice 1 and invoice 2 | Billing Document API (OData V4) or supported billing-due API | Billing reference type, source delivery, split criteria, exact API operation and successful response |
| Electronic Document Cockpit / e-way bill | Released eDocument API if available for configured country/process; otherwise UI fallback only after approval | Country/localization, eDocument type, API scope, form field mapping, status/number response |
| VF02 field changes | Billing Document API for supported fields; UI fallback for unsupported fields | Exact fields being changed and released API support |
| Invoice attachment/PDF | Billing PDF/output API or supported attachment/output service | Exact service, attachment content response and output status |
| Print movement memo + invoices | Local application/approved print agent | Printer/agent deployment and print acknowledgement |

## Safe implementation decisions
- Continue API-first; do not replay SAP GUI WebGUI batch HAR traffic.
- Do not enable writes against the production tenant identified in earlier system evidence.
- Use a test tenant and official API communication arrangement before live create/update/post operations.
- Treat each of the two delivery/invoice paths as a separate workflow instance, each with its own source order, delivery number, goods-issue reference (if applicable), billing number, e-document number/status and PDF.
- Make creation operations idempotent and reconcile after timeouts before retrying.
- Keep all sample identifiers above in test fixtures/documentation only, never as hard-coded production values.

## Exact evidence needed to finish the integration
1. AutoLine SAP edition (Public Cloud / Private Cloud / on-premise), release and test-tenant base URL.
2. SAP communication arrangement(s), authentication method, API scopes and service activation (share configuration names, never secrets).
3. One redacted successful API request + response for each operation: sales order read, delivery create, picking update, goods issue, billing create (both invoice cases), eDocument submit/update, billing PDF/attachment read.
4. The two source sales-order numbers and their item/schedule-line mapping from a non-production test run.
5. Expected mapping of vehicle registration, vendor type, transport mode, vehicle type, distance and other e-way-bill fields to SAP API properties/custom fields.
6. Exact meaning of the two invoice cases: two distinct deliveries, split billing, or two bill-to/reference documents.
7. Confirmation whether VF02 changes any billing fields or is only used to access invoice attachments/output.
8. Confirmation of expected final documents: movement memo, invoice PDFs, e-way bill/IRN acknowledgement or other attachment, and print order.

## Privacy
Do not share unredacted HAR files, cookies, Authorization headers, CSRF tokens, SAP session identifiers, customer personal data or production credentials. Use a test tenant and redact identifiers not needed for field mapping.

# 02 — HAR audit

## Files reviewed
Four Chrome/WebInspector HAR files supplied with the task:
- `download` — 16 entries
- `download2` — 13 entries
- `download3` — 12 entries
- `download1.1` — 3 entries
- Total: **44 captured HTTP entries**

All captured traffic is to the company's SAP host `my424034.s4hana.cloud.sap`. HAR sessionized paths and session identifiers are intentionally not reproduced here.

## Important finding
The captured write traffic is predominantly:
`POST /sap/.../bc/gui/sap/its/webgui/batch/json`

This is SAP GUI for HTML / Internet Transaction Server WebGUI batch interaction traffic. It is not an SAP business OData API endpoint. The body contains GUI control paths and GUI actions (for example `value/...`, `focus/...`, `action/...`, `typeahead/send`, `get: state/ur`). It is useful evidence of what the user typed/clicked, but it is an internal UI protocol tied to GUI screen controls and sessions. Do not replay it from NestJS as an integration API.

The HARs do not show documented API paths such as `/sap/opu/odata/...` or `/sap/opu/odata4/...`.

## Per-file observations

### `download` (16 entries)
- 15 POST requests and 1 GET.
- Includes search/typeahead for sales document reference `264O001261` (the captured character may be letter O or zero; confirm from SAP).
- Delivery item overview and a tab switch.
- Quantity values entered into delivery picking fields: `24`.
- Vehicle registration entered in a custom subscreen text field: `GJ01KT4011`.
- A toolbar action follows the vehicle-field entry. Its business meaning must be confirmed in the SAP UI.

### `download2` (13 entries)
- 10 POST requests and 3 GET.
- Includes delivery item/material value-help interaction.
- Picking quantity fields populated with `34`.
- Vehicle registration `GJ01KT4011` entered in a custom subscreen.
- Toolbar action follows the custom field.

### `download3` (12 entries)
- 11 POST requests and 1 GET.
- Transport/e-document general details form:
  - vendor type value `2`
  - transport mode value `1`
  - vehicle type value `R`
  - transport distance value `5`
  - vehicle number `GJ01KT4011`
- A toolbar action follows the entered transport details.
- Numeric codes are preserved as observed; their business labels require confirmation.

### `download1.1` (3 entries)
- 2 POST requests and 1 GET.
- Billing-document reference field uses typeahead/search for `80555698`.
- The capture does not include a clear successful billing creation response or PDF download.

## Missing evidence / likely additional captures needed
The four HARs are partial. They do not provide enough evidence to reproduce the entire SAP process:
1. Initial navigation into each relevant app/transaction.
2. Complete delivery creation from the sales order, including all header and item data.
3. SAP response containing the created delivery number.
4. Complete picking save and goods issue operation/result.
5. Exact custom field technical name and its business meaning for vehicle number.
6. Complete transport/e-way bill save response and resulting document number/status.
7. Complete billing creation action and successful billing document response.
8. Invoice PDF/output retrieval or print action.
9. Any approval, confirmation or error dialogs.

## Capture guidance
Capture one business operation per HAR:
- Search/read sales order.
- Create outbound delivery.
- Change picking quantity.
- Save/post goods issue.
- Save transport/e-way-bill details.
- Create billing document.
- Retrieve invoice PDF/output.

Use a test tenant and non-production test data where possible. Preserve request/response body and timestamps. Redact cookies, authorization headers, CSRF tokens, session IDs, customer/employee personal data before sharing.

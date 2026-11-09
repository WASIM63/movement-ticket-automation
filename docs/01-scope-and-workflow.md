# 01 — Scope and workflow

## Goal
Replace the handwritten movement memo with a small internal web form. Employees select master data from searchable dropdowns, enter quantities and transport details, save a movement ticket, then (after SAP integration is confirmed) execute the SAP document workflow and print the movement memo plus SAP invoice.

## Confirmed from the supplied screen recording
The 200-second recording shows SAP S/4HANA Cloud Fiori launchpad and a transaction-like SAP GUI for HTML workflow. The visible sequence includes:
- An outbound-delivery style item overview with material/item rows.
- A screen for transport / general transport details.
- A delivery processing screen with item table and tabs.
- Editing picking quantities.
- A header/custom-field area where a vehicle registration is entered.
- A separate billing-document creation / reference-selection screen.
- A transport/e-way-bill-related form with transport mode, vehicle type, distance and vehicle number.
- A billing document reference lookup screen.

The exact SAP transaction names and the final print/output sequence are not legible or proven by the recording. The app therefore captures the memo inputs but does not pretend to execute unverified SAP steps.

## Form fields implemented
- Plant (optional until master data is populated)
- Vehicle registration (required)
- Ticket date (required, defaults to today)
- Sales order reference
- Vendor type (HAR captured code `2`; display label unconfirmed)
- Transport mode (HAR captured code `1`; display label unconfirmed)
- Vehicle type (HAR captured code `R`; display label unconfirmed)
- Distance in km
- Remarks
- Multiple part rows: part/product selection and quantity

Part selection auto-fills product code, customer reference, default sales order, Sub M and unit from the local master data.

## Deliberately excluded
- OCR and paper movement ticket parsing.
- AI extraction.
- Unrequested reporting/analytics.
- Production SAP write operations until the company API contract, authorizations, test tenant and custom field mappings are verified.
- Automatic silent printing from a remote browser. Printing must be done from an authorized office print agent or explicit browser print flow.

## Status meanings
- `DRAFT`: saved locally, not submitted to SAP.
- `SAP_PROCESSING`, `SAP_COMPLETED`, `PRINT_PENDING`, `PRINTED`: reserved for future integration stages. Do not set these states until the corresponding action actually succeeds.

# 04 — Data model

## Tables
- `Plant`: plant code and display name.
- `Vehicle`: registration number and optional description.
- `Part`: product code, part name, customer reference, default sales order, Sub M and unit.
- `MovementTicket`: ticket number/date, plant, vehicle, sales order, transport details, notes and SAP references/status.
- `MovementTicketItem`: immutable snapshot of selected product and reference data plus quantity.
- `AuditLog`: application actions associated with an entity.

## Why ticket items store snapshots
Part master data can change later. The ticket keeps the part name, product code, customer reference, sales order and Sub M as they were when the ticket was created.

## Master-data loading
Do not import uncertain OCR/transcribed values into production. Use the CSV templates:
- `templates/plants.csv`
- `templates/vehicles.csv`
- `templates/parts.csv`

The starter includes a simple Master Data page to add records one at a time. CSV bulk import is intentionally not implemented in this first slice; use a reviewed migration/seed script for bulk import so duplicates and incorrect references are caught.

## Initial master data
No photographed row was silently treated as authoritative seed data. The photographed master list is small print and some handwritten identifiers conflict with printed values. A verified spreadsheet export from SAP or the owner is preferred.

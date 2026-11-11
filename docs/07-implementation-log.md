# 07 — Implementation log

This log records the modifications made in the first implementation pass.

## Inputs reviewed
- Original `nest-starter-vezlon.zip` starter kit.
- Screen recording (200 seconds).
- Four HAR files (44 entries total).
- Earlier screenshots identifying SAP S/4HANA Cloud 2608 / Production tenant.
- Official SAP Help Portal documentation for S/4HANA Cloud 2608.

## Starter-kit changes
1. Preserved the NestJS 11 application foundation and Velzon assets.
2. Replaced the demo root page with a Movement Dashboard.
3. Added a standalone responsive EJS layout with Velzon/Bootstrap styling.
4. Added navigation for dashboard, movement tickets, create ticket and master data.
5. Added a movement ticket form with searchable vehicle and part dropdowns.
6. Added repeatable part rows and quantity entry.
7. Added local master-data maintenance for plants, vehicles and parts.
8. Added ticket list and ticket detail/print view.
9. Added NestJS controllers and services for master data and movement tickets.
10. Added Prisma/MySQL schema for plants, vehicles, parts, tickets, ticket items and audit logs.
11. Added an initial MySQL migration and seed command.
12. Added SAP integration status and a billing-PDF retrieval route.
13. Added a fail-closed SAP delivery write placeholder. No SAP write is performed.
14. Added Dockerfile and Docker Compose for a single-server deployment.
15. Added `.env.example`, runbook, workflow docs, HAR audit and AI-agent instructions.
16. Removed the stale Yarn lockfile because package dependencies changed. Run `npm install` to create a current `package-lock.json`.

## Why live SAP writes are not implemented in this pass
The supplied HARs show SAP GUI for HTML batch requests rather than documented OData business API requests. The screen recording and HARs do not establish the exact order item/schedule-line mapping, shipping point, delivery date, goods-issue operation, custom field ID, or successful billing/PDF flow. The SAP tenant shown is Production. A guessed write could create duplicate or incorrect business documents. Live delivery creation therefore fails closed until the test-tenant API contract is confirmed.

## Validation performed
- Inspected starter source, package manifest, controllers, templates and asset structure.
- Parsed all four HAR files and counted 44 entries.
- Reviewed sampled HAR request bodies for SAP GUI field paths and values.
- Sampled the screen recording at 10-second intervals.
- Reviewed official SAP Help Portal API pages for release 2608.
- Dependency installation was attempted but did not finish in the build environment; Prisma generation, TypeScript build, migrations and browser testing remain to be run locally.

## Follow-up implementation sequence
1. Install dependencies and validate build.
2. Import reviewed plant/vehicle/part master data.
3. Verify ticket creation and print layout.
4. Obtain API communication arrangement and test credentials.
5. Capture complete OData API requests/responses from the test tenant.
6. Implement delivery creation and picking/goods issue with idempotency.
7. Implement billing creation and invoice PDF retrieval.
8. Add print agent for the office printer.
9. Add user authentication and role-based authorization before production use.


## Sandbox OData adapter expansion (2026-11-11)
1. Expanded the SAP integration service from a single Sales Order GET adapter to configurable OData V2/V4 read resources for sales orders, outbound deliveries, billing documents, electronic-document files and attachments.
2. Added billing PDF retrieval returning base64 content and content type.
3. Added parameterized POST/PATCH forwarding for documented delivery creation, picking, billing creation and future field-update operations.
4. Restricted the client to HTTPS `sandbox.api.sap.com`; production tenant hosts are rejected.
5. Kept sandbox writes fail-closed behind `SAP_SANDBOX_ALLOW_WRITES=false` by default.
6. Added documented default service paths for Sales Order V2, Outbound Delivery V2, Billing Document V2/V4, delivery creation, picking and Billing Document Get PDF.
7. Added environment configuration and `docs/11-sap-sandbox-odata-adapter.md`.

## Remaining validation
- The Hub API key has not yet been supplied/configured locally.
- API Hub sandbox availability for each API/action is not yet proven by successful calls.
- Electronic Document Cockpit fields and VF02 attachment list still require exact API/entity mapping.
- Delivery custom vehicle field remains unmapped.
- Billing-due selection operation remains to be verified.
- Print agent is not implemented.
- GitHub connector cannot run npm install, TypeScript build, Jest, Prisma generation or browser tests. Run these after pulling `main`.

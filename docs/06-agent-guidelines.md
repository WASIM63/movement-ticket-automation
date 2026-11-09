# 06 — AI coding agent instructions

## Read first
Read root `README.md`, then all files in `docs/` before changing workflow code.

## Non-negotiable rules
1. Do not replay SAP GUI WebGUI `/sap/bc/gui/sap/its/webgui/batch/json` requests as a backend integration. These are UI/session interactions, not the documented business API contract.
2. Do not guess SAP API payloads, schedule-line identifiers, shipping points, custom field names, transport codes, goods issue steps or invoice output steps.
3. Keep SAP write mode disabled until a test tenant, communication arrangement, official API documentation and verified sample requests/responses are available.
4. Never commit SAP credentials, session cookies, CSRF tokens, production customer data or unredacted HAR files.
5. Keep `MovementTicket` and `MovementTicketItem` as the source of the local memo record. Store the original selected master-data snapshot in each item.
6. Do not mark a ticket SAP-complete or printed unless the external operation returned a confirmed success.
7. Use idempotency/reconciliation before retrying SAP document creation. A network timeout does not prove SAP failed to create a document.
8. Every new workflow step must be documented in `docs/` and reflected in status transitions.
9. Prefer NestJS services for business logic; EJS should remain presentation only.
10. Keep the app small: only implement the movement memo → SAP delivery/billing → document printing workflow requested.

## Known gaps
- No login/role management in this first slice.
- No CSV bulk import.
- No live SAP write operations.
- No local print agent.
- No final verified SAP delivery/billing process map.

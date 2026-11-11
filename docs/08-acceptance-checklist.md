# 08 — Acceptance checklist

## First local application slice
- [ ] `npm install` completes
- [ ] Prisma client generation completes
- [ ] MySQL migration deploys cleanly
- [ ] `/` dashboard loads
- [ ] `/master-data` can add verified plants, vehicles and parts
- [ ] `/movement-tickets/new` dropdowns are searchable
- [ ] Selecting a part fills product/customer/order/Sub M references
- [ ] User can add/remove multiple part rows
- [ ] Quantity must be greater than zero
- [ ] Ticket saves and appears in `/movement-tickets`
- [ ] Ticket detail displays all item rows and prints cleanly

## SAP integration (blocked pending customer test tenant/API details)
- [ ] Communication arrangement/API authentication verified
- [ ] Sales order read and item/schedule-line selection verified
- [ ] Outbound delivery create payload verified
- [ ] Picking quantity update verified
- [ ] Goods issue step and response verified
- [ ] Vehicle/transport custom fields mapped
- [ ] Billing document creation verified
- [ ] Invoice PDF retrieval verified
- [ ] Duplicate prevention and retry reconciliation tested

## Office printing
- [ ] Approved local print agent installed
- [ ] Movement ticket and invoice PDF print to correct printer
- [ ] Print result/failure recorded


## SAP Business Accelerator Hub sandbox adapter
- [ ] Configure personal Hub API key in local `.env` only
- [ ] `GET /api/sap/sandbox/status` reports key configured and built-in API paths
- [ ] Sales Order OData V2 collection GET returns sample data
- [ ] Sales Order key GET returns the selected sample order
- [ ] Outbound Delivery OData V2 GET returns sample data
- [ ] Billing Document OData V4 GET returns sample data
- [ ] Billing Document OData V2 GET returns sample data
- [ ] Billing Document Get PDF returns base64 PDF content
- [ ] Confirm each POST/PATCH operation is actually supported by Hub sandbox before enabling writes
- [ ] Test delivery creation with sample sales order only
- [ ] Test picking operation with a sample delivery and current ETag/CSRF requirements
- [ ] Test billing creation with a billable sample SD document
- [ ] Record real SAP document numbers from returned responses
- [ ] Verify electronic cockpit and attachment API availability separately
- [ ] Verify no request can reach the AutoLine production tenant

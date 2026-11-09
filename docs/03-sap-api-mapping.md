# 03 — SAP S/4HANA Cloud 2608 API mapping

## Environment evidence
The supplied SAP About/System screenshots identify:
- Product: SAP S/4HANA Cloud
- Release: 2608
- System name/client shown: TF3 / 100
- System role and tenant role: Production

Treat the system as Production. Do not test create/update/post actions against it without explicit authorization and a test tenant.

## Official SAP references reviewed
1. Outbound Delivery API — SAP Help, APIs for Delivery and Transportation, version 2608:
   https://help.sap.com/docs/SAP_S4HANA_CLOUD/588780cab2774a7ab9fffca3a7f919fe/a4c5d84ecef2494985883829a24e393c.html
   Standard service path observed in official docs:
   `/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=2`
   Documented operations include retrieve/query/create outbound delivery, change header/items and delivery processing operations. The exact create payload must follow the actual sales order/schedule line/shipping point/customizing.

2. Outbound Delivery retrieval:
   https://help.sap.com/docs/PRODUCT_ID/588780cab2774a7ab9fffca3a7f919fe/364944fb5b1246c7b4de26401b5f1f82.html

3. Billing Document API (OData V4):
   https://help.sap.com/docs/SAP_S4HANA_CLOUD/03c04db2a7434731b7fe21dca77440da/65680dabb62546029175655482f85edc.html
   This API can create billing documents with reference to billable SD documents, read/update supported fields, and post billing documents to accounting.

4. Create billing document from SD document:
   https://help.sap.com/docs/SAP_S4HANA_CLOUD/03c04db2a7434731b7fe21dca77440da/6b2add771a454ac889eddd2b6fa4301c.html
   Billing from outbound delivery may require goods issue to be posted first.

5. Billing Document - Read, Cancel, GetPDF (`API_BILLING_DOCUMENT_SRV`):
   https://help.sap.com/docs/SAP_S4HANA_CLOUD/03c04db2a7434731b7fe21dca77440da/fe6f3eda2f914d81b512493fd79e9769.html
   This API retrieves billing data and PDF copies of existing billing documents.

6. Communication arrangement:
   https://help.sap.com/docs/SAP_S4HANA_CLOUD/0f69f8fb28ac4bf48d2b57b9637e81fa/f01e74db88b74aa58699a59e44d90164.html
   API authentication and communication scenario must be configured by SAP administrators. Do not assume OAuth is supported for every API; confirm the API-specific supported methods and communication arrangement.

## Candidate process (not yet validated against customer configuration)
1. Read/validate sales order and items.
2. Create outbound delivery with reference to sales order.
3. Retrieve delivery and item identifiers.
4. Update picking quantities using supported delivery API operation(s).
5. Post goods issue if required by the actual process.
6. Create billing document with reference to the billable delivery.
7. Retrieve invoice PDF using billing PDF API.
8. Generate movement ticket PDF locally and send both documents to an approved local print agent.

## Unresolved mapping
- Which exact sales order item and schedule line(s) are selected?
- Is the current SAP process creating delivery by reference or changing an existing delivery?
- Which shipping point, plant, storage location and delivery date are required?
- Are quantities entered as delivery quantity, picking quantity, or both?
- Which API operation is used to post goods issue in this tenant?
- Is vehicle number a standard delivery field or customer custom field? HAR points to a custom subscreen field (`GS_SAP_GUI_UI_FIELDS-TEXT_FIELD_VALUE`) but does not reveal its underlying SAP custom field ID.
- Are transport mode/vehicle type/distance for e-way bill, transportation data, or a custom integration?
- Is billing created directly from delivery, from a billing due list, or through another process?
- Is invoice output produced by SAP Output Management or another output service?

## Integration implementation policy
The app defaults to `SAP_MODE=mock`. Live SAP writes are intentionally disabled. This is not an incomplete accidental stub: it is a safety boundary because the available evidence is GUI batch traffic, not the required API contract. Implement each live operation only after the SAP team supplies the communication arrangement, API scope, sample API request/response from the test tenant and exact custom field mapping.

# 05 — Local runbook

## Requirements
- Node.js 22 LTS recommended
- Yarn classic or npm
- MySQL 8+
- Git

## 1. Configure
```bash
cp .env.example .env
```
Set `DATABASE_URL` and a long random `SESSION_SECRET`.

## 2. Create database
Example MySQL:
```sql
CREATE DATABASE movement_ticket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'movement_user'@'%' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON movement_ticket.* TO 'movement_user'@'%';
FLUSH PRIVILEGES;
```

## 3. Install and migrate
```bash
yarn install
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
```

## 4. Run
```bash
yarn start:dev
```
Open `http://localhost:9000`.

## 5. Add master data
Open `/master-data` and add verified plant, vehicle and part records. The create ticket form uses searchable Choices.js dropdowns. A ticket can be saved locally and printed from its detail page.

## 6. SAP mode
Default is `SAP_MODE=mock`. The SAP status endpoint is `/api/sap/status`. This first delivery does not issue production SAP write requests. Set `SAP_MODE=api` only after:
- SAP administrator has configured a communication arrangement.
- A test tenant and integration credentials are available.
- Required API scopes/authorizations are granted.
- Sales order item/schedule line, shipping point, delivery date, units, picking and custom vehicle field mappings are documented.
- API payloads have been tested and signed off.

## 7. Production deployment
Use Docker Compose and a reverse proxy with TLS. Do not expose MySQL publicly. Configure automated off-host database backups, log rotation, monitoring and access controls. Add a proper authentication/authorization module before allowing multiple employees to use the production system. The current MVP is an internal workflow foundation and is not production-hardened for multi-user access.

## 8. Current verification
The source has been generated from the supplied starter kit and statically inspected. Dependency installation, Prisma generation, MySQL migrations and an end-to-end SAP test require your local environment and company SAP access; they are not claimed as completed here.

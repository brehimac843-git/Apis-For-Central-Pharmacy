# Centralized Pharmacy Platform

A federated pharmacy search and management platform. A central aggregator (`main-api`) queries decentralized pharmacy node APIs, each with its own PostgreSQL database.

## Prerequisites

- Node.js 18+
- PostgreSQL (local instance)

## Project Structure

```
backend/
  main-api/           Central aggregator (port 3000)
  api1/               Pharmacy node 1 (port 3001)
  api2/               Pharmacy node 2 (port 3002)
  api3/               Pharmacy node 3 (port 3003)
frontend-public/      Consumer app (port 5173)
frontend-backoffice/  Agent + admin portal (port 5174)
SQLs/                 Database seed dumps for pharmacy nodes
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create databases

```sql
CREATE DATABASE pharmacy_main;
CREATE DATABASE pharmacy_db1;
CREATE DATABASE pharmacy_db2;
CREATE DATABASE pharmacy_db3;
```

### 3. Configure environment

**backend/main-api/.env**
```
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/pharmacy_main?schema=public"
PORT=3000
JWT_SECRET=your_secret_here
```

**backend/api1/.env** (repeat for api2/api3 with different DB_NAME and PORT)
```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=PASSWORD
DB_NAME=pharmacy_db1
DB_PORT=5432
PORT=3001
```

**frontend-public/.env** and **frontend-backoffice/.env** (optional)
```
VITE_API_URL=http://localhost:3000
```

### 4. Push schemas and seed

```bash
cd backend/main-api && npx prisma db push && npx prisma db seed
cd ../api1 && npx prisma db push
cd ../api2 && npx prisma db push
cd ../api3 && npx prisma db push
```

Load drug data from `SQLs/db1.sql`, `db2.sql`, `db3.sql`. Each node needs the `pg_trgm` extension.

### 5. Start services

```bash
# All backend services
./start-cluster.sh

# Consumer app (port 5173)
cd frontend-public && npm run dev

# Back office — agent + admin (port 5174)
cd frontend-backoffice && npm run dev
```

Default admin credentials (from seed): `admin@pharma.ml` / `admin123`

## Frontends

| App | Port | Audience |
|-----|------|----------|
| `frontend-public` | 5173 | Consumers — search, accounts, search history |
| `frontend-backoffice` | 5174 | Agents and central admins |

## Agent Sync

When a central admin creates, updates, or deletes an agent, the change syncs to the pharmacy branch node's local `agents` table. Agent login verifies against the branch node.

# Centralized Pharmacy Platform

A federated pharmacy search and management platform. It includes a central aggregator (`backend/main-api`) and three branch pharmacy APIs (`backend/api1`, `backend/api2`, `backend/api3`), plus public and backoffice frontends.

## Prerequisites

- Node.js 18 or newer
- PostgreSQL installed and running locally
- `npm` available

## Project structure

```
backend/
  main-api/           Central aggregator API (port 3000)
  api1/               Pharmacy branch API 1 (port 3001)
  api2/               Pharmacy branch API 2 (port 3002)
  api3/               Pharmacy branch API 3 (port 3003)
frontend-public/      Public consumer SPA (port 5173)
frontend-backoffice/  Agent + admin portal SPA (port 5174)
SQLs/                 PostgreSQL database exports for branch node seed data
```

## Step-by-step setup

### 1. Clone repository and install dependencies

```bash
git clone <repository-url> reworked-apis
cd reworked-apis
npm install
```

Because this repo uses npm workspaces, this installs all backend and frontend dependencies.

### 2. Create PostgreSQL databases

Run the following in `psql` or your database GUI:

```sql
CREATE DATABASE pharmacy_main;
CREATE DATABASE pharmacy_db1;
CREATE DATABASE pharmacy_db2;
CREATE DATABASE pharmacy_db3;
```

### 3. Configure environment files

There are existing `.env` files for each backend package. Update the password value if your PostgreSQL password is not `strongpassword`.

#### `backend/main-api/.env`

```env
DATABASE_URL="postgresql://postgres:strongpassword@localhost:5432/pharmacy_main?schema=public"
PORT=3000
JWT_SECRET=super_secret_pharmacy_key_2026
```

#### `backend/api1/.env`

```env
DATABASE_URL="postgresql://postgres:strongpassword@localhost:5432/pharmacy_db1?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=strongpassword
DB_NAME=pharmacy_db1
PORT=3001
```

#### `backend/api2/.env`

```env
DATABASE_URL="postgresql://postgres:strongpassword@localhost:5432/pharmacy_db2?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=strongpassword
DB_NAME=pharmacy_db2
PORT=3002
```

#### `backend/api3/.env`

```env
DATABASE_URL="postgresql://postgres:strongpassword@localhost:5432/pharmacy_db3?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=strongpassword
DB_NAME=pharmacy_db3
PORT=3003
```

#### Frontend environment files (optional)

Both frontends can use the same value.

```env
VITE_API_URL=http://localhost:3000
```

If this file is absent, the apps default to `http://localhost:3000`.

### 4. Push Prisma schemas and seed all backend databases

Run these commands from the repo root:

```bash
cd backend/main-api
npx prisma db push
npm run seed

cd ../api1
npx prisma db push
npm run seed

cd ../api2
npx prisma db push
npm run seed

cd ../api3
npx prisma db push
npm run seed
```

That will create the database schema and insert the seeded records for each backend service.

> Note: each branch API seed script also creates the `pg_trgm` extension if needed.

### 5. Start backend services

From the repository root:

```bash
./start-cluster.sh
```

This launches all four backend services in parallel:

- `backend/main-api` → `http://localhost:3000`
- `backend/api1` → `http://localhost:3001`
- `backend/api2` → `http://localhost:3002`
- `backend/api3` → `http://localhost:3003`

### 6. Start the frontends

Open two terminals and run:

```bash
cd frontend-public
npm run dev
```

```bash
cd frontend-backoffice
npm run dev
```

## Seeded data supplied

### main-api

- 3 pharmacies connected to branch APIs
- central admin account
- 2 public users
- search history entries for sample users

### api1, api2, api3

- drug catalog data
- AMO reimbursement records
- one sample branch agent per node

## Login credentials

- Central admin: `admin@pharma.ml` / `admin123`
- Public users:
  - `user1@pharma.ml` / `userpass123`
  - `user2@pharma.ml` / `userpass123`
- Branch agents:
  - `AGENT1-DB1`
  - `AGENT2-DB2`
  - `AGENT3-DB3`

## Useful commands

From the repo root:

- `npm install` — install all workspaces
- `npm --workspace backend/main-api exec prisma db push` — push main-api schema
- `npm --workspace backend/api1 exec prisma db push` — push api1 schema
- `npm --workspace backend/api2 exec prisma db push` — push api2 schema
- `npm --workspace backend/api3 exec prisma db push` — push api3 schema
- `cd frontend-public && npm run dev` — start public web app
- `cd frontend-backoffice && npm run dev` — start backoffice app

## Troubleshooting

- If a backend fails to connect, verify the database name and password in the `.env` file.
- If frontend requests fail, ensure `main-api` is running at `http://localhost:3000` and the `VITE_API_URL` setting is correct.
- If `pg_trgm` is missing, run:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## Notes

This README now includes all required steps to clone the repo, configure PostgreSQL, seed all databases, and start the full platform with real seeded data.

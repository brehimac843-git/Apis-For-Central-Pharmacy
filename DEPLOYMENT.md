# Deployment guide

## What is deployable

The repository contains two Vite frontends:

- Public app: [frontend-public](frontend-public)
- Backoffice app: [frontend-backoffice](frontend-backoffice)

Both build successfully with Vite.

## Frontend deployment options

### Netlify

1. Create a new site from the repository.
2. Set the base directory to `frontend-public` or `frontend-backoffice`.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable:
   - `VITE_API_URL=https://your-main-api-domain.com`

### Vercel

1. Import the repository into Vercel.
2. Set the root directory to `frontend-public` or `frontend-backoffice`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   - `VITE_API_URL=https://your-main-api-domain.com`

## Backend deployment

The Node/Express backend in [backend/main-api](backend/main-api) can be deployed to Render, Railway, Fly.io, or a VPS.

### Required environment variables

- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`

### Important note

The current frontend expects the API at the URL provided by `VITE_API_URL`.
If you deploy the backend separately, make sure the frontend is configured to call that deployed backend URL.

## Recommended deployment architecture

- Frontend: Netlify or Vercel
- Backend API: Render / Railway / Fly.io
- Database: Neon, Supabase Postgres, Railway Postgres, or another managed PostgreSQL

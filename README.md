# WEB103_Hien_Vo_Project4_Frost-Foam

Frost & Foam is a full-stack drink customizer app with:
- React frontend (live preview, live price, prep-time estimate, save/list/detail/edit/delete flows)
- Node.js + Express backend (CRUD endpoints, save-time validation, backend price/time calculation)
- PostgreSQL-ready persistence (with in-memory fallback when `DATABASE_URL` is not set)

## Project Structure

- `/client` – Vite + React application
- `/server` – Express API and pricing/validation utilities

## Run Locally

### Backend

```bash
cd server
npm install
npm start
```

The API runs on `http://localhost:3001` by default.

Set `DATABASE_URL` (and optional `DATABASE_SSL=false`) to use PostgreSQL.
Without `DATABASE_URL`, the server uses an in-memory store for development.

### Frontend

```bash
cd client
npm install
npm run dev
```

By default, frontend API calls target `http://localhost:3001/api`.
You can override this with `VITE_API_URL`.

Create `client/.env` with:

```bash
VITE_API_URL=http://localhost:3001/api
```

If you are using GitHub Codespaces, point it to your forwarded backend URL instead:

```bash
VITE_API_URL=https://<your-codespace-name>-3001.app.github.dev/api
```

Also ensure port `3001` is forwarded and visible in the Codespaces **Ports** panel.

## Tests

Backend focused tests for pricing/prep-time/validation:

```bash
cd server
npm test
```

## API Endpoints

- `GET /api/health`
- `GET /api/drinks`
- `GET /api/drinks/:id`
- `POST /api/drinks`
- `PUT /api/drinks/:id`
- `DELETE /api/drinks/:id`

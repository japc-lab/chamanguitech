# Chamanguitech Monorepo

This repository contains both the Angular frontend and Node.js backend for the Chamanguitech project, now unified for local development and single-platform deployment.

---

## 🏗️ Project Structure

```
chamanguitech/
  pesaje-frontend/      # Angular app (frontend)
  pesaje-node-backend/  # Node.js app (backend, serves frontend in production)
```

---

## 🚀 Local Development

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd chamanguitech
```

### 2. Install dependencies

```bash
cd pesaje-node-backend && npm install
cd ../pesaje-frontend && npm install
```

### 3. Start the database (MongoDB)

```bash
cd ../pesaje-node-backend
docker compose up -d
```

### 4. Configure environment variables

- Copy `.env.template` to `.env` in `pesaje-node-backend/` and fill in the required values.

### 5. Run the backend (serves API and, in production build, the frontend)

```bash
cd pesaje-node-backend
npm start
```

- The backend will be available at `http://localhost:8080` (or your configured port).

### 6. Run the frontend (development mode)

```bash
cd pesaje-frontend
npm start
```

- The Angular app will be available at `http://localhost:4200`.
- The frontend is configured to use `http://localhost:8080/api` for API calls in development.

### 7. (Optional) Seed the database

Visit:
- `http://localhost:8080/api/v2/seed` (full seed)
- `http://localhost:8080/api/v2/seed?keepTxData=true` (seed catalog only)

---

## 🛠️ Building for Production

To build the frontend for production and place the output in the backend's `public/` directory:

```bash
cd pesaje-frontend
npm run build:prod
```

This will output static files to `../pesaje-node-backend/public/`.

---

## 🚀 Deployment (Render.com)

### Unified Fullstack Deployment

- The backend (Node.js) serves both API endpoints and the built Angular frontend from the same Render service.
- All routing (including SPA fallback) is handled by Express in the backend.
- No Netlify or separate frontend hosting is used.

### Deployment Flow

| Event                    | Environment | Deploys To          |
| ------------------------ | ----------- | ------------------- |
| Push to `main` branch    | QA          | Render QA backend   |
| GitHub release published | Production  | Render Prod backend |

### How it works

- **On push to `main`**: GitHub Actions builds the frontend, places it in the backend's `public/`, and triggers a deploy to the Render QA backend using a deploy hook.
- **On release**: GitHub Actions builds the frontend, places it in the backend's `public/`, and triggers a deploy to the Render Production backend using a deploy hook.

### GitHub Actions Workflows

- `.github/workflows/deploy-staging.yml` (QA): triggered on push to `main`.
- `.github/workflows/deploy-prod-on-release.yml` (Production): triggered on release published.

#### Required GitHub Secrets
- `RENDER_DEPLOY_HOOK_QA`
- `RENDER_DEPLOY_HOOK_PROD`

### Render Setup
- Disable auto-deploy from GitHub in Render dashboard.
- Use the Deploy Hook URLs for QA and Production services as GitHub secrets.

---

## 🚀 Render Build & Start Commands

Render is now responsible for building and deploying the fullstack app. Use the following commands in your Render service settings:

**Build Command:**
```bash
cd pesaje-frontend && npm ci && npm run build:prod && cd ../pesaje-node-backend && npm ci
```

**Start Command:**
```bash
cd pesaje-node-backend && npm start
```

- These commands ensure the frontend is built and output to the backend's public directory before the backend starts.
- No build artifacts are committed to git; everything is built fresh on each deploy.
- GitHub Actions deployment workflows are now disabled.

---

## 🔧 Environment Configuration

- **Frontend**: In development, uses `http://localhost:8080/api` for API calls. In production, uses relative `/api` paths (served by the backend).
- **Backend**: Configure environment variables in `pesaje-node-backend/.env`.

---

## 🛠️ Useful Commands

- **Run backend**: `cd pesaje-node-backend && npm start`
- **Run frontend (dev)**: `cd pesaje-frontend && npm start`
- **Build frontend (prod)**: `cd pesaje-frontend && npm run build:prod`
- **Seed database**: Visit `/api/v2/seed` endpoint on backend

---

## 📝 Notes

- The backend serves the frontend in production; no `_redirects` file or Netlify configuration is needed.
- All SPA routing and API proxying is handled by Express.
- For local development, run both frontend and backend separately.
- For production, only the backend is deployed (with the built frontend included).

---

For further details, see the `README.md` files in each subproject. 
# Running in Development

1. Clone the repository

2. Install dependencies:

```bash
npm install
```

3. Start the database:

```bash
docker compose up -d
```

4. Copy the `.env.template` file and rename it to `.env`

5. Fill in the environment variables defined in `.env`

6. Start the application in development mode:

```bash
npm start
```

7. Seed the database (optional):

Visit the following URL in your browser:

```bash
http://localhost:3000/api/v2/seed
```

To seed only catalog data and keep all other information (like transaction data), use:

```bash
http://localhost:3000/api/v2/seed?keepTxData=true
```

## 🛠 Tech Stack

* Node.js
* MongoDB


# 🚀 Deployment (Render.com via GitHub Actions)

This backend is deployed using **Render.com deploy hooks** and **GitHub Actions workflows**, matching the same release flow used by the frontend:

## ✅ Deployment Flow

| Event                    | Environment | Deploys To          |
| ------------------------ | ----------- | ------------------- |
| Push to `develop` branch | QA          | Render QA backend   |
| GitHub pre-release       | QA          | Render QA backend   |
| GitHub full release      | Production  | Render Prod backend |

## 🔧 Setup Instructions

### 1. Disable Git auto-deploy in Render

Go to the Render dashboard for your service → Settings → Turn off auto-deploy from GitHub.

### 2. Get your deploy hooks from Render

Each Render service (QA and Production) has a unique **Deploy Hook URL** under the "Manual Deploy" section.

### 3. Add the deploy hooks as GitHub secrets

In your repo settings, under "Actions → Secrets", add:

* `RENDER_DEPLOY_HOOK_QA`
* `RENDER_DEPLOY_HOOK_PROD`

### 4. GitHub Actions Workflows

#### ✅ `deploy-backend-qa.yml`

```yaml
name: Deploy Backend to Render QA

on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger QA deploy on Render
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_QA }}"
```

#### ✅ `deploy-backend-prod.yml`

```yaml
name: Deploy Backend to Render Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Trigger correct Render deploy
        run: |
          RELEASE_NAME="${{ github.event.release.name }}"
          
          if [ "${{ github.event.release.prerelease }}" = "true" ]; then
            echo "Pre-release detected. Deploying to QA backend..."
            curl -X POST \
              -H "Content-Type: application/json" \
              -d "{\"message\":\"Release: $RELEASE_NAME\"}" \
              "${{ secrets.RENDER_DEPLOY_HOOK_QA }}"
          else
            echo "Full release. Deploying to Production backend..."
            curl -X POST \
              -H "Content-Type: application/json" \
              -d "{\"message\":\"Release: $RELEASE_NAME\"}" \
              "${{ secrets.RENDER_DEPLOY_HOOK_PROD }}"
          fi

```

With this setup, all deployments are automated, controlled, and aligned with the frontend release strategy.

Let the GitHub Actions handle the deploy logic, while Render handles the build and run lifecycle.

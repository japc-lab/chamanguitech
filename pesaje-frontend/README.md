# Chamanguitech

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.x.x.

## 🚀 Getting Started (Local Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/Jonathan-s-Team/pesaje-frontend.git
   cd pesaje-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   ng serve
   ```

   Navigate to `http://localhost:4200/`.
   The app will automatically reload if you change any of the source files.

4. **Start the backend API**

   Make sure your backend server is running locally at:

   ```
   http://localhost:8080
   ```

   The frontend is configured to use `http://localhost:8080/api` for API calls in development (`src/environments/environment.ts`).

## 🔧 Environments

* **Local development** uses:
  `apiUrl: http://localhost:8080/api`

* **Production (deployed on Netlify)** uses:
  `apiUrl: /api`
  *(Handled via reverse proxy on Netlify)*

## 🚀 Deployment Strategy

* **QA (Staging)**

  * Every push to the `develop` branch automatically deploys to the **Netlify QA site** via GitHub Actions.
  * Publishing a **pre-release** (e.g., `v1.0.0-rc.1`) from the `main` branch will also deploy to **QA**.

* **Production**

  * A **full release** (e.g., `v1.0.0`) published from the `main` branch triggers a deploy to the **Netlify Production site**.

## 🔄 GitHub Workflows

This project uses two GitHub Actions workflows for CI/CD:

* **`deploy-staging.yml`**

  * Triggered on pushes to the `develop` branch
  * Builds the Angular app and deploys to Netlify QA

* **`deploy-prod-on-release.yml`**

  * Triggered when a GitHub release is published on the `main` branch
  * Deploys to:

    * **QA** if it’s a pre-release
    * **Production** if it’s a full release

GitHub secrets required:

* `NETLIFY_AUTH_TOKEN`
* `NETLIFY_QA_SITE_ID`
* `NETLIFY_PROD_SITE_ID`

## 🌐 Netlify `_redirects` File

The project includes a `_redirects` file to support:

* **Client-side routing (SPA):**

  ```
  /*    /index.html   200
  ```

* **API proxying for production deployments:**

  ```
  /api/*   http://localhost:8080/api/:splat   200
  ```

📁 Place `_redirects` in the `src/public` directory.

📦 Update `angular.json` under the `assets` section to ensure `_redirects` is copied during build:

```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  {
    "glob": "**/*",
    "input": "src/public",
    "output": "./"
  }
]
```

## 🔁 Environment-Based Proxy Routing (Netlify `_redirects`)

This project uses the Netlify `_redirects` file to handle **SPA routing** and **API proxying**.

Because your backend is deployed to **two different environments (QA and Production)**, the `_redirects` file is swapped manually during build depending on the environment.

### ✅ `_redirects` for QA

Default file: `src/public/_redirects`

```plaintext
/*    /index.html   200
/api/*  https://your-qa-backend.onrender.com/api/:splat  200
```

### ✅ `_redirects` for Production

Alternate file: `src/public/environments/_redirects.prod`

```plaintext
/*    /index.html   200
/api/*  https://your-prod-backend.onrender.com/api/:splat  200
```

### 📆 File Swapping in GitHub Actions

Angular does not allow `fileReplacements` for non-code files like `_redirects`, so swapping is done manually in your GitHub Actions workflow:

```yaml
- name: Replace _redirects for production
  run: cp src/public/environments/_redirects.prod src/public/_redirects
```

Run this step **before** the production build step.

### 🚀 How It Works

* **QA builds** use `src/public/_redirects` by default:

  ```bash
  ng build
  ```

* **Production builds** manually copy the prod version before building:

  ```bash
  cp src/public/environments/_redirects.prod src/public/_redirects
  ng build --configuration production
  ```

## 🛠️ Build

To build the project for production:

```bash
ng build
```

The output will be stored in the `dist/` directory.

## ✅ Running Unit Tests

To execute unit tests:

```bash
ng test
```

Uses [Karma](https://karma-runner.github.io) as the test runner.

## 🔍 Running End-to-End Tests

To run end-to-end tests (after configuring Cypress or Protractor):

```bash
ng e2e
```

> You may need to install and configure an appropriate e2e test framework.

## 💡 Code Generation

Generate components, services, and more using Angular CLI:

```bash
ng generate component my-component
ng generate service my-service
```

## ℹ️ Further Help

To explore more Angular CLI commands:

```bash
ng help
```

Or visit the [Angular CLI Documentation](https://angular.io/cli).

## 📄 Final Notes

👍 After this setup:

* Pushing to the `develop` branch **automatically deploys** to the **Netlify QA site**.

* Publishing a **GitHub release** from the `main` branch:

  * **Pre-releases** (e.g., `v1.0.0-rc.1`) deploy to the **Netlify QA site**.
  * **Full releases** (e.g., `v1.0.0`) deploy to the **Netlify Production site**.

* For production builds, `_redirects` is swapped via GitHub Actions before running `ng build --configuration production`.

* No manual uploads or build triggers are needed — deployment is fully automated via GitHub Actions.

* Each deploy carries the **last commit message** (for `develop`) or **release name and tag** (for `main`) as the deploy label in Netlify.

* Your workflow is clean, maintainable, and built for a **release-driven production process**.

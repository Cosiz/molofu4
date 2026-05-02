# GitHub Secrets Setup — Molofu4

Add these secrets to your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

## Required Secrets

| Secret | Where to find it |
|--------|-----------------|
| `VERCEL_ORG_ID` | vercel.com → Settings → Teams → copy Team ID |
| `VERCEL_PROJECT_ID` | vercel.com → Molofu4 project → Settings → copy Project ID |
| `DEPLOY_URL` | `https://molofu4.vercel.app` (add this as a plain text secret) |

## How to find them

1. **VERCEL_ORG_ID**: Log into Vercel → click your profile avatar → Settings → Teams. The Team ID is the string under the team name (starts with `team_`).

2. **VERCEL_PROJECT_ID**: Go to vercel.com/dashboard → select the Molofu4 project → Settings → General. Scroll to Project ID (starts with `prj_`).

3. **DEPLOY_URL**: After the first successful deploy, Vercel gives you a preview/production URL. Set it as `https://molofu4.vercel.app`.

## Notes

- `DEPLOY_URL` is used by the health check step after deploy. Update it if you get a custom domain.
- If you don't add these secrets, the `deploy.yml` workflow will fail.
- The `CI` workflow (pull request checks) does NOT require any secrets — it only builds and tests.

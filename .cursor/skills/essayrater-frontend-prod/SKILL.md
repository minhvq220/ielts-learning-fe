---
name: essayrater-frontend-prod
description: >-
  EssayRater Angular production config and login domain issues. Use when editing
  app.config.prod.ts, Firebase authDomain, Google login branding, reCAPTCHA
  domains, or when API requests hit the server IP instead of essayrater.online.
---

# EssayRater FE production

## Required prod config

`src/app/config/app.config.prod.ts`:

- `api.baseUrl`: `https://essayrater.online`
- `api.apiBasePath`: `/essayrater/api`
- `firebase.authDomain`: `essayrater.online` (needs Nginx `^~ /__/auth/` on server)

## Build & deploy

```powershell
npm run build
# upload dist/EssayRater/browser/* → /u01/essayrater/www/
```

Verify bundle has domain, not IP:

```powershell
Select-String -Path "dist\EssayRater\browser\*.js" -Pattern "essayrater.online"
Select-String -Path "dist\EssayRater\browser\*.js" -Pattern "103.162.30.50"
```

## Related backend docs

See sibling backend `deploy-guide/CLOUDFLARE_TUNNEL_PROGRESS_CHECKLIST.txt` parts 6.3–6.9 and skill `essayrater-deploy`.

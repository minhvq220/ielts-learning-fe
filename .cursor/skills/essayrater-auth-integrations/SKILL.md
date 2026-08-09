---
name: essayrater-auth-integrations
description: >-
  EssayRater third-party auth integrations on the frontend and shared consoles:
  Google Sign-In via Firebase, reCAPTCHA v3, OAuth branding/redirects. Use when
  editing login, app.config Firebase/reCAPTCHA/Google keys, auth/unauthorized-domain,
  Invalid domain for site key, or Google popup branding for essayrater.online.
---

# EssayRater auth integrations (FE + consoles)

Canonical full skill (includes backend verify + server paths) also lives in the
backend repo: `.cursor/skills/essayrater-auth-integrations/SKILL.md`.

## Flow (FE view)

1. `FirebaseService.signInWithGoogle()` → Google via Firebase
2. `RecaptchaService.execute('login')` → reCAPTCHA v3 token
3. `AuthService` → `POST {apiBase}/auth/google-login` with Firebase + captcha tokens
4. Store returned JWT for API calls

## Prod config

File: `src/app/config/app.config.prod.ts`

- `firebase.projectId`: `ielts-learning-d80dc`
- `firebase.authDomain`: `essayrater.online` (needs Nginx `/__/auth/` on server)
- `google.clientId`: Web OAuth client ID
- `recaptcha.siteKey`: reCAPTCHA v3 public site key
- `api.baseUrl`: `https://essayrater.online`
- `api.apiBasePath`: `/essayrater/api`

After changing prod config: `npm run build` → deploy `dist/EssayRater/browser/` → `/u01/essayrater/www/`.

## Consoles (hostname only, no https://)

| Console | What to add for prod |
|---------|----------------------|
| Firebase → Auth → Authorized domains | `essayrater.online` |
| reCAPTCHA Admin → Domains | `essayrater.online` |
| Google Cloud → OAuth Web client origins | `https://essayrater.online` |
| Google Cloud → OAuth redirect URIs | `https://essayrater.online/__/auth/handler` |
| Google Auth Platform → Branding | App name `EssayRater` (optional polish) |

## Common FE errors

| Error | Action |
|-------|--------|
| `auth/unauthorized-domain` | Firebase Authorized domains |
| `Invalid domain for site key` | reCAPTCHA Domains (no rebuild) |
| Continue to `*.firebaseapp.com` | Set `authDomain` + server Nginx `^~ /__/auth/` + OAuth redirect |
| API to IP instead of domain | Fix `api.baseUrl` → rebuild |

## Local docs

- `AUTHENTICATION_SETUP.md`, `HOW_KEYS_WORK.md`
- `FIX_FIREBASE_UNAUTHORIZED_DOMAIN.md`, `FIX_RECAPTCHA_DOMAIN.md`, `CONFIGURE_DOMAIN.md`

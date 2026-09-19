# Fibblr

Browser game: Scrabble board, digit tiles 0–9, Fibonacci-mod-10 words. Two players, live rooms, 3-hour expiry.

## Local

1. Install Node 20+ and clone this repo.
2. `npm install`
3. `npx convex login` then `npx convex dev` (writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`).
4. In another terminal, `npm run dev` (or `npm run dev:all` to run Convex and Next together).
5. Open two browsers, create a room, share `/room/<guid>`.

`npm test` runs the rules engine.

Local Convex in this checkout is currently **anonymous** (`http://127.0.0.1:3210`). Cloud hosting needs a Convex account and a Vercel project.

## Cloud (Convex + Vercel Hobby)

You need two free accounts: [Convex](https://dashboard.convex.dev) (GitHub login) and [Vercel](https://vercel.com/signup). Do these in order in a normal terminal (login cannot be completed from the agent).

### 1. Convex Cloud

```bash
npx convex login
```

Open the printed URL, sign in with GitHub, paste the token if asked.

Replace the local anonymous deployment with a cloud project:

```bash
npx convex dev --configure=new
```

Pick a team, name the project `fibblr`, and accept a **dev** deployment. Leave it running until it prints `Convex functions ready`.

Then in [dashboard.convex.dev](https://dashboard.convex.dev) → **fibblr**:

1. Deployment switcher: create / select **Production**.
2. Settings → **Generate Production Deploy Key** (enable `deployment:deploy`). Copy it.
3. Copy the production deployment URL (`https://….convex.cloud`).

```bash
npx convex deploy
```

### 2. GitHub

Commit this repo, create a GitHub remote, and push `main`. Vercel auto-deploys from that.

### 3. Vercel

```bash
npx vercel login
npx vercel link
```

In the Vercel project: **Settings → Environment Variables**

| Name | Value | Environments |
| --- | --- | --- |
| `CONVEX_DEPLOY_KEY` | Production deploy key from Convex | Production only |
| `NEXT_PUBLIC_CONVEX_URL` | Production `https://….convex.cloud` URL | Production (optional if the build command injects it) |

[vercel.json](vercel.json) already sets the build command to:

```text
npx convex deploy --cmd 'next build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

That deploys Convex functions, then Next, pointing the client at production.

```bash
npx vercel --prod
```

Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new) and push to `main`.

Open the `*.vercel.app` URL in two browsers and create a room.

### Later (optional)

- Preview deploys: Convex project settings → Preview Deploy Key → Vercel `CONVEX_DEPLOY_KEY` for **Preview** only (not the production key).
- Custom domain: Vercel project domains. No Convex custom domain is required for v1.

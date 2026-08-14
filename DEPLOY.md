# Deploy WhyItSlaps (Railway + Porkbun)

Website-only launch at **https://whyitslaps.com**. Spotify MUSIC analysis is the must-pass.

Do **not** commit secrets. Copy values from local `.env.local` into Railway Variables only.

## Env vars (names only)

Required:

- `ANTHROPIC_API_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

Optional:

- `ACRCLOUD_HOST`
- `ACRCLOUD_ACCESS_KEY`
- `ACRCLOUD_ACCESS_SECRET`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_EDITPLAN_MODEL`

## Railway (CLI or dashboard)

### Option A — CLI (from this repo)

```bash
railway login
railway init          # create / link a project
railway up            # build Dockerfile and deploy
railway variables set ANTHROPIC_API_KEY=… SPOTIFY_CLIENT_ID=… SPOTIFY_CLIENT_SECRET=…
# optional ACRCLOUD_* the same way
railway domain        # generate *.up.railway.app
```

Confirm the service builds from the root **Dockerfile** (not Nixpacks-only Node). Healthcheck path: `/api/health`.

### Option B — Dashboard

1. New project → Deploy from GitHub (`akabbas/WhyItSlaps`) or empty + local `railway up`.
2. Settings → Build → Dockerfile path: `Dockerfile`.
3. Variables → paste the keys listed above (from `.env.local`).
4. Networking → Generate Domain → note the `*.up.railway.app` URL.
5. Smoke-test Spotify MUSIC on that URL before touching DNS.

### Custom domain on Railway

1. Service → Settings → Networking → Custom Domain.
2. Add `whyitslaps.com` and `www.whyitslaps.com`.
3. Railway shows the **exact** target hostname (something like `….up.railway.app`). Use that value in Porkbun below.

## Porkbun DNS (whyitslaps.com)

Leave Porkbun **nameservers** as-is unless Railway explicitly requires otherwise.

In Porkbun → Domain → DNS for `whyitslaps.com`:

1. **Remove** parking / splash A records pointing at `207.207.210.50` / `207.207.210.36` (or any other parking IPs).
2. **Apex** (`whyitslaps.com` / blank host):
   - Type: **ALIAS** (CNAME flattening) — Porkbun supports this
   - Answer: the Railway hostname from Custom Domain (e.g. `something.up.railway.app`)
   - If ALIAS is unavailable, use the A/AAAA records Railway prints instead
3. **www**:
   - Type: **CNAME**
   - Host: `www`
   - Answer: the same Railway hostname
4. Wait for DNS + Railway TLS (often a few minutes; can be longer).

### Exact records checklist

| Host | Type  | Answer                                      | Notes                          |
|------|-------|---------------------------------------------|--------------------------------|
| `@`  | ALIAS | `<railway-custom-domain-target>`            | Replace with Railway’s value   |
| `www`| CNAME | `<railway-custom-domain-target>`            | Same target                    |
| —    | —     | Delete parking A `207.207.210.50` / `.36`   | Required so splash page dies   |

## Smoke tests

1. `GET https://<railway-url>/api/health` → `{ ok: true }`
2. MUSIC mode: paste `https://open.spotify.com/track/…` → diagnosis
3. After DNS: same Spotify flow on **https://whyitslaps.com** (must-pass)

Nice-to-have: TikTok/YouTube paste. Instagram: save reel → **Upload clip** (URL paste often fails in cloud).

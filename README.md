# thelegwork.ai

Static marketing site for Legwork, served by GitHub Pages from the `main` branch root.

- `CNAME` pins the custom domain (`thelegwork.ai`); `www` redirects to it automatically.
- `.nojekyll` stops GitHub from running Jekyll over the files.
- `download/` and `solutions/` are meta-refresh redirects (GitHub Pages has no server redirects).
- Security headers cannot be set on GitHub Pages, so the Content-Security-Policy is a `<meta>` tag in every page's `<head>`. Keep CSS and JS in external files: no inline styles or scripts.
- The early-access form posts to `https://app.thelegwork.ai/api/early-access` (served by the RIA app server, `server/early-access.mjs` in Legwork-Demo). Signups are emailed to tech@ and logged on the server.

Deploy: commit and push to `main`. GitHub Pages publishes within a minute.

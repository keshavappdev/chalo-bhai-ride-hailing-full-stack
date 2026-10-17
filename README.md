# Chalo Bhai — Admin Panel & Backend

React/Vite admin console and Node.js/Express/Mongoose API with Socket.IO.

## Local configuration

1. In `backend`, copy `.env.example` to `.env`, then provide your own local `MONGODB_URI` and a **long, unique** `JWT_SECRET`. The example uses a local, unauthenticated MongoDB URL; replace it if your database uses authentication. Never commit the `.env`.
2. In `admin`, copy `.env.example` to `.env` and configure `VITE_API_BASE_URL` and `VITE_SOCKET_URL`.
3. Optionally set server-side Google Routes/Firebase credentials in the **backend-only** `.env`. Firebase service account JSON must remain private. A browser `VITE_GOOGLE_MAPS_API_KEY` is not secret and must be restricted by allowed origins / APIs.
4. Install dependencies independently in each folder using `npm install`.
5. Start the backend with `cd backend && npm run dev` and the admin app with `cd admin && npm run dev` (in separate terminals).
6. To create an admin account, set a **unique** `ADMIN_EMAIL` and `ADMIN_PASSWORD` (10+ characters) in `backend/.env` and run `cd backend && npm run seed:admin`. The example email and password are placeholders, **not** usable credentials and must not be reused for deployment.

## Security and publishing

- Do not commit `.env`, service-account JSON, database exports, tokens, or secrets.
- Generate secrets privately and rotate any credentials that have previously appeared in a committed Git history. Cleaning a working tree does **not** clean Git history.
- Review project authorization, session/token storage, CORS, rate limiting, dependency advisories and cloud credentials before production deployment. The admin UI currently stores a JWT in `localStorage`; consider an appropriate session design for your threat model.
- A source-content audit does not constitute a penetration test or guarantee that live secrets were never exposed elsewhere.
- Review `SECURITY_AUDIT.md` for the scan methodology and findings.

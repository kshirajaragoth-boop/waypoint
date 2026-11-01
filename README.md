# Waypoint prototype

## Run locally

Open `Waypoint.html` directly for the local-only prototype. Local data stays in browser storage. To exercise Vercel Functions and MongoDB locally, run `npm install`, configure `.env.local` from `.env.example`, then use `npx vercel dev`.

## Deploy to Vercel

1. Import this project into Vercel and set the project root to this folder.
2. Add `MONGODB_URI` and `MONGODB_DB` in the Vercel project environment variables. Do not commit `.env.local` or database credentials.
3. In MongoDB Atlas, create a database user with access only to the `waypoint` database. Restrict network access to Vercel's configured egress/static IPs where available.
4. Deploy. Vercel serves `Waypoint.html` and the functions in `api/`.

The API stores password-hashed user accounts, opaque HttpOnly sessions, per-user workspaces, and uploaded files in MongoDB/GridFS. CarePath is seeded into each account's workspace and is kept when user projects are saved.

The local prototype does not authenticate users. Hosted deployments use the API; account data is not synchronized to the local-only browser profile.

Attachments are limited to 2.5 MB each and supported formats are JPEG, PNG, GIF, WebP, PDF, plain text, and CSV. Google search actions open a normal Google results URL; no search API key is used.

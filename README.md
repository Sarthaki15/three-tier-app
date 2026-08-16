# Task Tracker — a simple 3-tier web app

A minimal example of **3-tier architecture**, built as a small task manager.
Each tier lives in its own file(s) and only talks to the tier next to it.

```
┌─────────────────────┐      HTTP       ┌─────────────────────┐      SQL       ┌─────────────────────┐
│   TIER 1: Browser    │ ───────────────▶│  TIER 2: Server      │ ──────────────▶│  TIER 3: Database    │
│   public/index.html  │                 │  server.js            │                │  db.js + tasks.db    │
│   public/style.css   │◀─────────────── │  Express, validation  │◀────────────── │  SQLite (better-     │
│   public/app.js      │      JSON       │  routes/business logic│    rows        │  sqlite3)             │
└─────────────────────┘                  └─────────────────────┘                └─────────────────────┘
```

| Tier | Responsibility | Files |
|---|---|---|
| **1. Presentation** | Renders the UI, collects input, calls the API with `fetch()`. Has zero knowledge of the database. | `public/index.html`, `public/style.css`, `public/app.js` |
| **2. Application / Logic** | Express server. Defines REST routes, validates input, enforces rules (e.g. title can't be empty), and shapes responses. Has zero knowledge of HTML or SQL syntax details — it calls functions from the data tier. | `server.js` |
| **3. Data** | Owns the schema and the only code that talks to MySQL directly. Exposes plain functions (`getAllTasks`, `createTask`, etc.) to the tier above. | `db.js` |

Keeping the tiers separate like this means you could swap MySQL for
PostgreSQL by only editing `db.js`, or swap the frontend for React by only
editing `public/`, without touching the other tiers. It also means the same
codebase runs unmodified against a local MySQL instance or an AWS RDS
instance — only the environment variables change.

## Running it locally

You'll need [Node.js](https://nodejs.org) (v18+) and a MySQL-compatible
server (MySQL or MariaDB) installed and running.

```bash
cd three-tier-app
npm install
cp .env.example .env      # then edit .env with your DB credentials
npm start
```

The app creates its `tasks` table automatically on first run — no manual
schema setup needed. Then open **http://localhost:3000** in your browser.

### Connecting to AWS RDS instead of a local database

1. Create a MySQL-engine RDS instance (see the deployment steps below).
2. In `.env`, set `DB_HOST` to the RDS endpoint (e.g.
   `mydb.xxxxxxx.us-east-1.rds.amazonaws.com`) and fill in the credentials
   you set when creating the instance.
3. Make sure the RDS security group allows inbound MySQL (port 3306) only
   from your EC2 instance's security group — not from the public internet.
4. Nothing else changes — `npm start` will connect to RDS the same way it
   connects locally.

## What it does

- Add a task → `POST /api/tasks`
- Check a task off → `PATCH /api/tasks/:id`
- Delete a task → `DELETE /api/tasks/:id`
- List tasks → `GET /api/tasks`

The diagram at the top of the page lights up tier by tier each time you
perform an action, so you can watch the request travel from the browser,
through the server, to the database, and back.

## Project structure

```
three-tier-app/
├── package.json
├── .env.example       ← template for DB credentials (copy to .env)
├── server.js         ← Tier 2: Express app + API routes
├── db.js              ← Tier 3: MySQL schema + queries (mysql2)
└── public/
    ├── index.html    ← Tier 1: markup
    ├── style.css      ← Tier 1: styling
    └── app.js          ← Tier 1: fetch calls + DOM rendering
```

## Next steps to extend it

- Add user accounts (a `users` table + sessions/JWT in Tier 2)
- Add due dates and sorting/filtering
- Swap MySQL for PostgreSQL by only editing `db.js`
- Add automated tests for the API routes in `server.js`
- Deploy to AWS: EC2 (or Elastic Beanstalk) for Tier 2, RDS (MySQL engine)
  for Tier 3 — see the deployment notes for connecting via `.env`

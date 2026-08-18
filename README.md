# G6 Vendor Portal

Vendor registration, approval, billing, and invoicing portal for G6 Labs Asia.

## Stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- PostgreSQL + Prisma ORM
- Custom email/password auth (bcrypt + JWT session cookie)
- `@react-pdf/renderer` for auto-generated PDF invoices

## Features

- Public vendor registration for **Business** or **Individual** vendors, capturing company/contact details and bank details. New accounts start as `PENDING`.
- Admin approval workflow: admin reviews pending vendors and assigns an account type on approval — **Business**, **Freelancer**, or **Contract Freelancer**.
- Admin can also manually create a vendor of any account type (`/admin/vendors/new`), auto-approved with an admin-set initial password — useful for onboarding without waiting on self-registration.
- **Business** vendors upload invoices as bills (file + amount + description); admin can approve/reject each bill.
- **Freelancer** vendors submit multi-row task/deliverable entries; the portal auto-generates a PDF invoice.
- **Contract Freelancer** deliverables are entered by admin (one-time entry, editable); the portal auto-generates/regenerates the PDF invoice on save.
- **Contract Freelancer auto-billing**: admin sets a recurring description/amount and next billing date per vendor. A protected endpoint (`POST /api/cron/generate-recurring-invoices`, header `x-cron-secret: $CRON_SECRET`) generates invoices for everyone due and advances their next billing date by a month — point any scheduler (cron, Vercel Cron, GitHub Actions) at it. Admin can also trigger it on demand from the dashboard ("Run Billing Now").
- Admin-configurable billing info (`/admin/settings`) — company name/address/tax ID/contact — used as the "Bill To" block on generated invoices.
- Payment tracking: admin marks a bill or invoice as paid (amount paid + transaction fee), which generates a downloadable PDF receipt (amount paid, fee, net amount).
- Freelancer/Contract Freelancer vendors can pick from 3 invoice templates (Classic, Modern, Minimal) and customize logo, watermark text, and footer text.
- Self-service password recovery (`/forgot-password`) and profile management (contact/bank details, password change) for both vendors and admin.
- Dark, glass-morphic UI matching the G6 Labs Asia design system (Inter + JetBrains Mono, purple accent, sidebar navigation).

## Local Development

### 1. Get a PostgreSQL database running

Docker is not required — any reachable Postgres instance works. Pick one:

**Option A: Docker Compose** (if you have Docker installed)

```bash
docker compose up -d
```

**Option B: Native PostgreSQL install** (no Docker)

macOS:

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s g6vendor -P          # set a password, e.g. g6vendor
createdb g6_vendor_portal -O g6vendor
```

Ubuntu/Debian:

```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE ROLE g6vendor LOGIN PASSWORD 'g6vendor' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE g6_vendor_portal OWNER g6vendor;"
```

Windows: install PostgreSQL from postgresql.org, then create the same role/database with `psql` or pgAdmin.

**Option C: Any existing/hosted Postgres** — just point `DATABASE_URL` at it in step 2.

### 2. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` already match the `g6vendor` / `g6_vendor_portal` role and database created above. Edit `.env` as needed — in particular set a strong `SESSION_SECRET`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the seeded admin account.

### 3. Install dependencies and set up the database

```bash
npm install
npx prisma migrate deploy   # or `npx prisma migrate dev` in development
npm run db:seed             # creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD
```

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. Register a vendor at `/register`, or sign in as admin at `/login` with the seeded admin credentials.

## File Storage

Uploaded bills, vendor logos, and generated invoice PDFs are stored on local disk under `UPLOAD_DIR` (default `./uploads`, gitignored). Files are served through authenticated API routes (`/api/bills/[id]/file`, `/api/invoices/[id]/pdf`, `/api/vendor/logo`) that check the requester owns the resource or is an admin. For a production deployment, swap `src/lib/storage.ts` for an object storage backend (e.g. S3) if persistent/scalable storage is required.

## Data Model

See `prisma/schema.prisma`. Key models: `User` (login/role), `Vendor` (profile, bank details, status, account type, invoice branding, recurring billing config), `Bill` (Business invoice uploads + payment/receipt fields), `InvoiceSubmission` + `TaskLineItem` (Freelancer/Contract Freelancer invoices + payment/receipt fields), `OrgSettings` (singleton billing info), `PasswordResetToken`.

## Password Recovery — Important Caveat

There is no SMTP/email provider wired up. `/forgot-password` generates a one-time reset link and displays it **directly on the page** instead of emailing it (link expires in 1 hour, single-use). This is convenient for internal/demo use but is **not production-secure** — anyone who can see the requester's screen sees the link. For a real production rollout, wire up an email provider in `src/actions/passwordReset.ts` and stop returning the link in the response.

## Notes / Follow-ups for a production rollout

- No email/SMTP is wired up — vendors don't get notified when approved/rejected, and password reset links are shown on-screen rather than emailed (see above).
- Admin accounts are seeded only (no self-registration or admin invite flow).
- Currency is unit-less (plain numeric formatting); add a currency field if G6 needs multi-currency support.
- `CRON_SECRET` in `.env` protects the recurring-billing endpoint. A GitHub Actions workflow (`.github/workflows/recurring-invoices.yml`) hits `POST /api/cron/generate-recurring-invoices` daily at 01:00 UTC (and can be run on demand via "Run workflow"). To enable it, set in the repo's Settings → Secrets and variables → Actions:
  - Variable `APP_URL` — the deployed app's base URL (e.g. `https://vendor.g6labs.asia`), no trailing slash.
  - Secret `CRON_SECRET` — must match the value in the deployment's `.env`.

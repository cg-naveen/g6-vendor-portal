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
- **Business** vendors upload invoices as bills (file + amount + description); admin can approve/reject each bill.
- **Freelancer** vendors submit multi-row task/deliverable entries; the portal auto-generates a PDF invoice.
- **Contract Freelancer** deliverables are entered by admin (one-time entry, editable); the portal auto-generates/regenerates the PDF invoice on save.
- Freelancer/Contract Freelancer vendors can pick from 3 invoice templates (Classic, Modern, Minimal) and customize logo, watermark text, and footer text.

## Local Development

### 1. Start PostgreSQL

Using Docker Compose:

```bash
docker compose up -d
```

Or point `DATABASE_URL` in `.env` at any existing Postgres instance.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` as needed — in particular set a strong `SESSION_SECRET`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the seeded admin account.

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

See `prisma/schema.prisma`. Key models: `User` (login/role), `Vendor` (profile, bank details, status, account type, invoice branding), `Bill` (Business invoice uploads), `InvoiceSubmission` + `TaskLineItem` (Freelancer/Contract Freelancer auto-generated invoices).

## Notes / Follow-ups for a production rollout

- No email/SMTP is wired up — vendors don't get notified when approved/rejected; add a mail provider if needed.
- Admin accounts are seeded only (no self-registration or admin invite flow).
- Currency is unit-less (plain numeric formatting); add a currency field if G6 needs multi-currency support.

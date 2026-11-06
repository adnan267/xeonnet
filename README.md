# Xeon Net — website v2

Two parts in one repository:

| Folder | What | Technology | Vercel project |
|---|---|---|---|
| `frontend/` | Public website (dark / light), client portal, staff panel | Next.js 15 + React 19 + TypeScript | `xeonnet` → **xeonnet.site** |
| `backend/` | API, database, emails, SMS, reminders | Django 5 + Django REST Framework + PostgreSQL | `xeonnet-api` → **api.xeonnet.site** |

The browser only talks to `xeonnet.site`; Next.js forwards `/api/*` to Django, so logins work on one domain.

## What is inside

* **Website** – Home, About, Services (+13 detail pages), Portfolio (+case studies), Our Brands, Clients, Team, Reviews, Contact, Verify a Certificate. Dark and light theme with two logos. Text lives in `frontend/content/site.json`, colours/fonts in `frontend/app/globals.css` (top of the file).
* **Client portal** (`/portal`) – invoices, proposals (accept online), payments, project progress, support.
* **Staff panel** (`/staff`) – role based:
  * Admin – everything
  * Sales – clients, proposals, invoices, projects, inbox
  * Accounts – payments and billing overview
  * HR – certificates, team list
  * Team member – own projects and tasks
* **Billing** – proposals & invoices (numbers start at 0335: `XN-INV-2026-0335`), PDF via print, share link `/d/<secret>`, WhatsApp share, proposal → invoice, partial / paid / overdue worked out automatically.
* **Automatic emails & SMS** – invoice/proposal sent, payment receipt, 3 days before due, overdue (repeats every 7 days), client portal invitation. Every message is logged (`/staff/notifications`).
* **Certificates** – issue internship certificates / letters with a code + QR, public verification at `/verify`.

## Deploy on Vercel (two projects from this repo)

1. **Database** – create a free PostgreSQL database on Neon or Supabase and copy its connection string.
2. **Backend project** – Vercel → Add New Project → this repo → *Root Directory* `backend`. Environment variables (see `backend/.env.example`):
   `SECRET_KEY`, `DATABASE_URL`, `SITE_URL=https://xeonnet.site`, `AUTO_MIGRATE=1`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, `SMS_PROVIDER` (+ its keys).
   Add the domain `api.xeonnet.site`. The daily reminder job is already set in `backend/vercel.json`.
3. **Frontend project** – Add New Project → same repo → *Root Directory* `frontend` (framework: Next.js). Variables: `API_URL=https://api.xeonnet.site`, `NEXT_PUBLIC_SITE_URL=https://xeonnet.site`. Move the domain `xeonnet.site` to this project.
4. Open `https://xeonnet.site/login` and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Fill bank details in **Settings**, add your team in **Team**.

### Email (Resend)
Sign up at resend.com → add domain `xeonnet.site` → add the DNS records it shows (in Vercel → Domains → xeonnet.site → DNS) → create an API key → put it in `RESEND_API_KEY`.

### SMS
* Twilio (UK + Pakistan): `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.
* Any Pakistani SMS company with an HTTP API: `SMS_PROVIDER=http`, `SMS_HTTP_URL=https://…?to={to}&msg={message}` (`{to}` and `{message}` are filled in).
Then tick **Send SMS to clients** in Settings.

## Run on your computer

```bash
cd backend && pip install -r requirements.txt
DEBUG=1 python manage.py migrate && DEBUG=1 python manage.py createsuperuser
DEBUG=1 python manage.py runserver            # http://127.0.0.1:8000
cd ../frontend && npm install && npm run dev  # http://localhost:3000
DEBUG=1 python manage.py test office          # backend tests
```

The previous Flask site is kept on the `main` branch.

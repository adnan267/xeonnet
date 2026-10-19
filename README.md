# Xeon Net — xeonnet.site

Python (Flask) website — frontend + backend.
IT services since 2007: basic (hardware, networking, hosting) se advance (full stack, apps, cloud, AI) tak.

## Features
- Home page: hero ("Since 2007"), journey timeline 2007 → aaj, services 3 levels mein (Foundation → Growth → Advanced), Why Us, Process, Contact
- Har service ka apna detail page: `/services/<slug>`
- Contact form + newsletter — SQLite database mein save (page reload ke baghair submit)
- Admin panel `/admin` — inquiries dekhein, read/unread, reply, delete; subscribers list
- JSON API: `/api/services`, health check: `/health`
- Mobile responsive, WhatsApp button, SEO meta tags, CSRF + honeypot spam protection

## Content edit karna
Saara text **`data.py`** mein hai — company info (email, phone, WhatsApp, address), timeline, services.
`TODO` wali lines mein apni asli details daalein.

## Local par chalana
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Browser: http://127.0.0.1:5000  ·  Admin: http://127.0.0.1:5000/admin

Default admin login: `admin` / `xeonnet@2007` — **live karne se pehle zaroor badlein** (neeche dekhein).

## Live karna (xeonnet.site)

### Option A — cPanel hosting ("Setup Python App")
1. cPanel → **Setup Python App** → Create Application
   - Python version: 3.10+ · Application root: `xeonnet` · Application URL: `xeonnet.site`
   - Startup file: `passenger_wsgi.py` · Entry point: `application`
2. Saari files File Manager se `xeonnet` folder mein upload karein.
3. Same page par **Environment variables** add karein: `SECRET_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD`.
4. "Run Pip Install" → `requirements.txt`, phir **Restart**.

### Option B — VPS (Ubuntu + Nginx)
```bash
pip install -r requirements.txt
export SECRET_KEY=... ADMIN_PASSWORD=...
gunicorn -w 3 -b 127.0.0.1:8000 wsgi:app
```
Nginx mein `xeonnet.site` ko `proxy_pass http://127.0.0.1:8000;` par point karein aur Certbot se SSL lagayein.

## Folder structure
```
app.py              routes, database, admin
data.py             saara website content
passenger_wsgi.py   cPanel entry
templates/          HTML (Jinja2)
static/css|js|img   design, script, logo
instance/xeonnet.db database (khud ban jata hai)
```

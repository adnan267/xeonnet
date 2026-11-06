"""
Tiny database layer: SQLite locally, PostgreSQL in production.

  * No DATABASE_URL  -> SQLite file (instance/xeonnet.db, or /tmp on Vercel)
  * DATABASE_URL set -> PostgreSQL (Neon, Supabase, Railway ...), data is permanent

SQL is written once with `?` placeholders; they are converted for PostgreSQL.
"""
import os
import sqlite3

try:  # only needed when DATABASE_URL is set
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover
    psycopg = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def database_url():
    url = os.environ.get("DATABASE_URL", "").strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


def sqlite_path():
    if os.environ.get("DATABASE_PATH"):
        return os.environ["DATABASE_PATH"]
    if os.environ.get("VERCEL"):
        return "/tmp/xeonnet.db"          # Vercel: only /tmp is writable (and it is temporary)
    return os.path.join(BASE_DIR, "instance", "xeonnet.db")


def is_temporary_storage():
    """True when data would be lost (serverless + SQLite)."""
    return not database_url() and bool(os.environ.get("VERCEL"))


class Database:
    def __init__(self):
        self.url = database_url()
        self.kind = "pg" if self.url else "sqlite"
        if self.kind == "pg":
            if psycopg is None:
                raise RuntimeError("DATABASE_URL is set but psycopg is not installed "
                                   "(pip install 'psycopg[binary]').")
            # prepare_threshold=None keeps it compatible with pgbouncer / pooled URLs
            self.conn = psycopg.connect(self.url, row_factory=dict_row,
                                        prepare_threshold=None, connect_timeout=10)
        else:
            path = sqlite_path()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            self.conn = sqlite3.connect(path)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA foreign_keys = ON")

    # SQL is written with ? placeholders
    def _sql(self, sql):
        if self.kind == "pg":
            return sql.replace("%", "%%").replace("?", "%s")
        return sql

    def execute(self, sql, params=()):
        return self.conn.execute(self._sql(sql), tuple(params))

    def insert(self, sql, params=()):
        """INSERT and return the new row id."""
        if self.kind == "pg":
            return self.conn.execute(self._sql(sql) + " RETURNING id", tuple(params)).fetchone()["id"]
        return self.conn.execute(sql, tuple(params)).lastrowid

    def scalar(self, sql, params=(), default=0):
        row = self.execute(sql, params).fetchone()
        if row is None:
            return default
        value = row["v"]
        return default if value is None else value

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        try:
            self.conn.close()
        except Exception:  # noqa: BLE001
            pass


SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
    id         {PK},
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    service    TEXT,
    budget     TEXT,
    message    TEXT NOT NULL,
    ip         TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
    id         {PK},
    name       TEXT NOT NULL,
    role       TEXT,
    rating     INTEGER NOT NULL,
    text       TEXT NOT NULL,
    approved   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS subscribers (
    id         {PK},
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS clients (
    id         {PK},
    name       TEXT NOT NULL,
    company    TEXT,
    email      TEXT,
    phone      TEXT,
    address    TEXT,
    notes      TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
    id             {PK},
    doc_type       TEXT NOT NULL,
    number         TEXT NOT NULL UNIQUE,
    client_id      INTEGER REFERENCES clients(id),
    title          TEXT,
    issue_date     TEXT NOT NULL,
    due_date       TEXT,
    currency       TEXT NOT NULL DEFAULT 'PKR',
    discount_type  TEXT NOT NULL DEFAULT 'amount',
    discount_value {REAL} NOT NULL DEFAULT 0,
    tax_percent    {REAL} NOT NULL DEFAULT 0,
    paid_amount    {REAL} NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'draft',
    intro          TEXT,
    scope          TEXT,
    timeline       TEXT,
    terms          TEXT,
    notes          TEXT,
    token          TEXT NOT NULL UNIQUE,
    source_id      INTEGER,
    accepted_at    TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS document_items (
    id          {PK},
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    qty         {REAL} NOT NULL DEFAULT 1,
    unit_price  {REAL} NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS credentials (
    id          {PK},
    code        TEXT NOT NULL UNIQUE,
    holder_name TEXT NOT NULL,
    doc_type    TEXT NOT NULL,
    title       TEXT,
    period      TEXT,
    issued_on   TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'valid',
    note        TEXT,
    created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
    id          {PK},
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    amount      {REAL} NOT NULL,
    paid_on     TEXT NOT NULL,
    method      TEXT,
    note        TEXT,
    created_at  TEXT NOT NULL
);
"""

_ready = False


def init_schema(db):
    """Create tables if missing. Safe to call repeatedly."""
    global _ready
    if _ready:
        return
    pk = "SERIAL PRIMARY KEY" if db.kind == "pg" else "INTEGER PRIMARY KEY AUTOINCREMENT"
    real = "DOUBLE PRECISION" if db.kind == "pg" else "REAL"
    script = SCHEMA.replace("{PK}", pk).replace("{REAL}", real)
    try:
        for stmt in script.split(";"):
            if stmt.strip():
                db.execute(stmt)
        db.commit()
    except Exception:  # noqa: BLE001  (another instance may be creating tables at the same time)
        db.rollback()
        for stmt in script.split(";"):
            if stmt.strip():
                try:
                    db.execute(stmt)
                    db.commit()
                except Exception:  # noqa: BLE001
                    db.rollback()
    _ready = True

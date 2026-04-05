import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./trends.db")

_is_sqlite = DATABASE_URL.startswith("sqlite")

_engine_kwargs: dict = {}
if _is_sqlite:
    # FastAPI runs DB work across threads; SQLite requires this for shared connections.
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_title_column_sqlite(conn) -> None:
    if (
        conn.execute(
            text(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='reddit_posts'"
            )
        ).fetchone()
        is None
    ):
        return
    cols = conn.execute(text("PRAGMA table_info(reddit_posts)")).fetchall()
    names = {row[1] for row in cols}
    if "title" not in names:
        conn.execute(
            text("ALTER TABLE reddit_posts ADD COLUMN title TEXT NOT NULL DEFAULT ''")
        )


def _ensure_title_column_postgres(conn) -> None:
    conn.execute(
        text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'reddit_posts' AND column_name = 'title'
                ) THEN
                    ALTER TABLE reddit_posts ADD COLUMN title TEXT NOT NULL DEFAULT '';
                END IF;
            END $$;
        """)
    )


def init_db() -> None:
    # SQLite has no TIMESTAMPTZ; TIMESTAMP is portable enough for stored datetimes.
    created_at_type = "TIMESTAMP" if _is_sqlite else "TIMESTAMPTZ"
    ddl = f"""
        CREATE TABLE IF NOT EXISTS reddit_posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT '',
            text TEXT NOT NULL,
            engagement INTEGER NOT NULL DEFAULT 0,
            created_at {created_at_type} NOT NULL
        )
    """
    with engine.begin() as conn:
        conn.execute(text(ddl))
        if _is_sqlite:
            _ensure_title_column_sqlite(conn)
        else:
            _ensure_title_column_postgres(conn)

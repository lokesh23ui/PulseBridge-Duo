import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pulsebridge.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

def _apply_sqlite_migrations(eng):
    if "sqlite" not in str(eng.url):
        return
    columns = [
        ("users", "status", "VARCHAR(32) DEFAULT 'active'"),
        ("users", "is_active", "BOOLEAN DEFAULT 1"),
        ("audit_logs", "target_entity", "VARCHAR(64)"),
        ("audit_logs", "target_id", "VARCHAR(64)"),
        ("audit_logs", "status", "VARCHAR(32) DEFAULT 'SUCCESS'")
    ]
    with eng.connect() as conn:
        for tbl, col, col_def in columns:
            try:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col} {col_def}"))
                conn.commit()
            except Exception:
                pass

_apply_sqlite_migrations(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

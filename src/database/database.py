from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from src.core.config import APP_DATABASE_URL

# Engine da app em runtime — usa o role restrito (RLS vale de verdade aqui).
# Migrações (Alembic) usam o DATABASE_URL admin direto de src.core.config,
# não essa engine, porque o role restrito não tem privilégio de DDL.
engine = create_engine(APP_DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
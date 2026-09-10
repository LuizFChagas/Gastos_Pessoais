from sqlalchemy import create_engine, event, text
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


@event.listens_for(SessionLocal, "after_begin")
def _reaplicar_contexto_rls(session, transaction, connection):
    """Reaplica app.current_user_id (usado pelas políticas de RLS) toda vez
    que uma transação nova começa nessa sessão.

    Necessário porque o pooler do Supabase pode entregar uma conexão física
    diferente depois de cada commit — qualquer set_config feito na conexão
    anterior se perde, e a próxima query passa a rodar sem contexto de RLS
    (a política filtra tudo, e um db.refresh() logo em seguida falha com
    "Could not refresh instance"). Sem isso, seria preciso lembrar de
    re-setar manualmente antes de cada commit em toda função que commita
    mais de uma vez por request — já causou bug reincidente.

    get_db_autenticado (src/auth/security.py) marca session.info["usuario_id"]
    logo que resolve o usuário logado; sessões sem essa marca (rotas públicas,
    Alembic) não sofrem nenhum efeito colateral."""
    usuario_id = session.info.get("usuario_id")
    if usuario_id is not None:
        connection.execute(
            text("SELECT set_config('app.current_user_id', :uid, true)"),
            {"uid": str(usuario_id)},
        )
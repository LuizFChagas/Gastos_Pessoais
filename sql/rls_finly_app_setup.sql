-- Setup do role restrito finly_app + RLS em produção (Supabase Postgres).
--
-- Documenta o estado que já está aplicado em produção desde o commit
-- 1740c3d ("feat: RLS de verdade no Postgres") — até agora só existia
-- rodado à mão contra o banco, sem versionamento. Idempotente: pode
-- rodar de novo sem quebrar nada (útil pra recriar staging/disaster
-- recovery, ou conferir se produção não divergiu).
--
-- Rodar como o role admin (postgres) via SQL Editor do Supabase.
-- Depois de rodar, a senha do role precisa ser definida à parte
-- (não versionar senha em texto puro): ver passo 2 no fim do arquivo.

-- 1) Role da aplicação: login normal, SEM BYPASSRLS/SUPERUSER.
--    É o que faz o RLS valer alguma coisa — o role postgres tem
--    BYPASSRLS e ignora qualquer política daqui pra baixo.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finly_app') THEN
        CREATE ROLE finly_app LOGIN PASSWORD 'TROCAR_ANTES_DE_RODAR';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO finly_app;
GRANT USAGE ON SCHEMA public TO finly_app;

-- 2) Tabelas que a aplicação precisa ler/escrever.
--    usuarios fica de fora do RLS (login/cadastro/esqueci-senha buscam
--    por email/token antes de existir identidade logada), mas ainda
--    precisa dos GRANTs normais de CRUD.
GRANT SELECT, INSERT, UPDATE, DELETE ON
    usuarios,
    gastos,
    extratos,
    investimentos,
    aportes,
    categorias_personalizadas,
    sugestoes
TO finly_app;

GRANT USAGE ON
    usuarios_id_seq,
    gastos_id_seq,
    extratos_id_seq,
    investimentos_id_seq,
    aportes_id_seq,
    categorias_personalizadas_id_seq,
    sugestoes_id_seq
TO finly_app;

-- 3) RLS: habilita e cria a política de isolamento por usuário_id nas
--    6 tabelas com dado do usuário. O valor de app.current_user_id é
--    setado por request em src/auth/security.py::get_db_autenticado
--    via set_config — por isso o NULLIF(...,'') antes do cast: o
--    Postgres não volta pra NULL depois do primeiro set_config numa
--    conexão pooled, volta pra string vazia.
DO $$
DECLARE
    tabela text;
BEGIN
    FOREACH tabela IN ARRAY ARRAY[
        'gastos', 'extratos', 'investimentos',
        'aportes', 'categorias_personalizadas', 'sugestoes'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabela);

        EXECUTE format('DROP POLICY IF EXISTS isolamento_usuario ON %I', tabela);
        EXECUTE format(
            'CREATE POLICY isolamento_usuario ON %I
                USING (usuario_id = NULLIF(current_setting(''app.current_user_id'', true), '''')::integer)
                WITH CHECK (usuario_id = NULLIF(current_setting(''app.current_user_id'', true), '''')::integer)',
            tabela
        );
    END LOOP;
END
$$;

-- ─────────────────────────────────────────────────────────────────
-- Passo 2 (fazer à parte, NUNCA commitar a senha real):
--
--   ALTER ROLE finly_app WITH PASSWORD 'senha-forte-aqui';
--
-- Depois, montar a APP_DATABASE_URL com esse role/senha e configurar
-- no Render. IMPORTANTE: o pooler do Supabase (Supavisor) exige o
-- usuário qualificado com o project ref, não só "finly_app" — senão
-- a conexão falha com "no tenant identifier provided":
--
--   postgresql://finly_app.<project-ref>:<senha-url-encoded>@<mesmo-host-e-porta-da-DATABASE_URL>/postgres
--
-- <project-ref> é o mesmo sufixo que já aparece no usuário da
-- DATABASE_URL admin (postgres.<project-ref>). Senha precisa ir
-- url-encoded se tiver caracteres especiais (ex: "@" vira "%40").
--
-- Sem essa env var no Render, o app continua caindo no DATABASE_URL
-- (role postgres, com BYPASSRLS) — ver src/core/config.py.

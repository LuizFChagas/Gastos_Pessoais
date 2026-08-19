"""Verifica que o RLS do Postgres isola usuarios de verdade, no nivel do
banco -- sem passar pela API (que ja filtra por usuario_id em toda query;
esse script existe pra pegar o caso em que so a policy de RLS falhou).

Cria dois usuarios de teste direto via role admin, insere um gasto para
cada um, e confere via role restrito (finly_app) que:
  - setando app.current_user_id pro usuario A, so o gasto de A aparece
  - setando pro usuario B, so o gasto de B aparece
  - sem setar current_user_id nenhum, nenhum gasto aparece

Limpa os dados de teste no final independente do resultado.

Uso:
    python scripts/verificar_isolamento_rls.py "<DATABASE_URL admin>" "<APP_DATABASE_URL finly_app>"
"""
import sys
import psycopg2


def main():
    if len(sys.argv) != 3:
        print("uso: python verificar_isolamento_rls.py <DATABASE_URL> <APP_DATABASE_URL>")
        sys.exit(1)

    admin_url, app_url = sys.argv[1], sys.argv[2]

    admin = psycopg2.connect(admin_url)
    admin.autocommit = True
    acur = admin.cursor()

    email_a = "_teste_rls_a@example.com"
    email_b = "_teste_rls_b@example.com"

    try:
        # limpa qualquer resto de execucao anterior
        acur.execute("DELETE FROM gastos WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN (%s, %s))", (email_a, email_b))
        acur.execute("DELETE FROM usuarios WHERE email IN (%s, %s)", (email_a, email_b))

        acur.execute(
            "INSERT INTO usuarios (email, senha, nome, email_verificado) VALUES (%s, 'x', 'Teste A', true) RETURNING id",
            (email_a,),
        )
        id_a = acur.fetchone()[0]
        acur.execute(
            "INSERT INTO usuarios (email, senha, nome, email_verificado) VALUES (%s, 'x', 'Teste B', true) RETURNING id",
            (email_b,),
        )
        id_b = acur.fetchone()[0]

        acur.execute(
            "INSERT INTO gastos (descricao, valor, categoria, tipo, usuario_id) VALUES ('gasto A', 10, 'teste', 'saida', %s)",
            (id_a,),
        )
        acur.execute(
            "INSERT INTO gastos (descricao, valor, categoria, tipo, usuario_id) VALUES ('gasto B', 20, 'teste', 'saida', %s)",
            (id_b,),
        )

        print(f"usuarios de teste criados: A={id_a} B={id_b}")

        # ── conecta como o role restrito, igual a app em runtime ──
        app_conn = psycopg2.connect(app_url)
        app_cur = app_conn.cursor()

        def contar_gastos_como(usuario_id):
            app_cur.execute("BEGIN")
            if usuario_id is None:
                app_cur.execute("SELECT set_config('app.current_user_id', '', true)")
            else:
                app_cur.execute("SELECT set_config('app.current_user_id', %s, true)", (str(usuario_id),))
            app_cur.execute("SELECT usuario_id FROM gastos WHERE usuario_id IN (%s, %s) ORDER BY usuario_id", (id_a, id_b))
            rows = [r[0] for r in app_cur.fetchall()]
            app_cur.execute("COMMIT")
            return rows

        ok = True

        vistos_a = contar_gastos_como(id_a)
        if vistos_a == [id_a]:
            print(f"OK: como usuario A, so ve gasto de A ({vistos_a})")
        else:
            print(f"FALHA: como usuario A, deveria ver so [{id_a}], viu {vistos_a}")
            ok = False

        vistos_b = contar_gastos_como(id_b)
        if vistos_b == [id_b]:
            print(f"OK: como usuario B, so ve gasto de B ({vistos_b})")
        else:
            print(f"FALHA: como usuario B, deveria ver so [{id_b}], viu {vistos_b}")
            ok = False

        vistos_ninguem = contar_gastos_como(None)
        if vistos_ninguem == []:
            print("OK: sem current_user_id setado, nao ve nenhum gasto")
        else:
            print(f"FALHA: sem current_user_id, deveria ver [], viu {vistos_ninguem}")
            ok = False

        app_conn.close()

        print("\nRESULTADO:", "ISOLAMENTO OK" if ok else "ISOLAMENTO FALHOU -- investigar antes de usar em producao")
        sys.exit(0 if ok else 1)

    finally:
        acur.execute("DELETE FROM gastos WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN (%s, %s))", (email_a, email_b))
        acur.execute("DELETE FROM usuarios WHERE email IN (%s, %s)", (email_a, email_b))
        admin.close()
        print("dados de teste removidos")


if __name__ == "__main__":
    main()

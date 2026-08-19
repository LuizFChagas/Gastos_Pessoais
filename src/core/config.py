import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
# Conexão usada pela app em runtime — role restrito (sem BYPASSRLS) pra RLS
# valer de verdade. Sem essa var definida, cai no DATABASE_URL de sempre
# (role admin), então subir o código sozinho não corta o acesso na hora.
APP_DATABASE_URL = os.getenv("APP_DATABASE_URL", DATABASE_URL)
# Chave simétrica (Fernet) usada por src/database/crypto_types.py pra
# cifrar campos sensíveis (descrição/valor de gasto, dados de investimento
# etc) antes de gravar no banco. Gerar com Fernet.generate_key().
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY não definida no .env")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL não definida no .env")

if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY não definida no .env")
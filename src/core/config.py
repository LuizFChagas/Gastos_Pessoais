import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
# Conexão usada pela app em runtime — role restrito (sem BYPASSRLS) pra RLS
# valer de verdade. Sem essa var definida, cai no DATABASE_URL de sempre
# (role admin), então subir o código sozinho não corta o acesso na hora.
APP_DATABASE_URL = os.getenv("APP_DATABASE_URL", DATABASE_URL)

if not SECRET_KEY:
    raise ValueError("SECRET_KEY não definida no .env")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL não definida no .env")
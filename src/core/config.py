import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY não definida no .env")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL não definida no .env")
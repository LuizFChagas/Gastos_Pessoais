"""Tipos de coluna SQLAlchemy que cifram/decifram automaticamente com Fernet
(AES-128-CBC + HMAC, chave em ENCRYPTION_KEY). Transparente pro resto do
código: ler/escrever o atributo do model funciona igual a uma coluna comum,
a cifra acontece só na borda entre o Python e o banco.

Fernet gera um token diferente a cada chamada (IV aleatório), então essas
colunas NÃO podem ser comparadas/ordenadas/somadas em SQL (WHERE, ORDER BY,
SUM, ==) — só depois de carregadas e decifradas em Python.
"""
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator

from src.core.config import ENCRYPTION_KEY

_fernet = Fernet(ENCRYPTION_KEY.encode())


class EncryptedString(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return _fernet.encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return _fernet.decrypt(value.encode()).decode()
        except InvalidToken:
            raise ValueError(
                "Valor no banco não está cifrado com a ENCRYPTION_KEY atual "
                "(dado legado não migrado ou chave errada)"
            )


class EncryptedFloat(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return _fernet.encrypt(str(float(value)).encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return float(_fernet.decrypt(value.encode()).decode())
        except InvalidToken:
            raise ValueError(
                "Valor no banco não está cifrado com a ENCRYPTION_KEY atual "
                "(dado legado não migrado ou chave errada)"
            )

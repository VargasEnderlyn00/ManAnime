import psycopg2
from psycopg2 import pool as pg_pool
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

db_pool = pg_pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=20,
    dsn=DATABASE_URL
)

def get_connection():
    return db_pool.getconn()

def put_connection(conn):
    db_pool.putconn(conn)

class Database:
    @staticmethod
    def execute(query, params=None):
        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(query, params)
                if cur.description:
                    return cur.fetchall()
                return cur.rowcount
        finally:
            db_pool.putconn(conn)
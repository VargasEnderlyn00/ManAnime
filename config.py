import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = os.getenv('DATABASE_URL')
    PORT = os.getenv('PORT', 3000)
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
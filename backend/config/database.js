const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,                    // máximo de conexiones
    idleTimeoutMillis: 30000,   // cerrar conexión si está inactiva
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✅ Conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Error en el pool de conexiones:', err);
});

module.exports = pool;
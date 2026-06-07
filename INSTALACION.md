# Guía de Instalación - ManAnime

## Requisitos del Sistema

- **Sistema Operativo:** Windows, macOS o Linux
- **Node.js:** v14.0.0 o superior
- **PostgreSQL:** v12 o superior
- **npm:** v6.0.0 o superior
- **Git:** Para clonar el repositorio

## Paso a Paso - Instalación en una Nueva Computadora

### 1. Instalar Node.js y npm

Descargar e instalar desde: https://nodejs.org

Verificar instalación:
```bash
node --version
npm --version
```

### 2. Instalar PostgreSQL

**Windows:**
- Descargar desde: https://www.postgresql.org/download/windows/
- Durante la instalación, anotar la contraseña del usuario `postgres`

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. Crear la Base de Datos

Abrir la consola de PostgreSQL:
```bash
psql -U postgres
```

Crear la base de datos:
```sql
CREATE DATABASE manganime_db;
CREATE USER manganime_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE manganime_db TO manganime_user;
\q
```

### 4. Ejecutar el Script de Schema

El archivo `schema.sql` contiene las tablas faltantes. Ejecutar:
```bash
psql -U postgres -d manganime_db -f schema.sql
```
```sql
-- Crear tablas principales
CREATE TABLE generos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE animes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    titulo_japones VARCHAR(100),
    sinopsis TEXT,
    ano_lanzamiento INTEGER,
    temporadas INTEGER,
    episodios INTEGER,
    estado VARCHAR(20),
    calificacion_promedio DECIMAL(3,1),
    imagen_url TEXT,
    trailer_url TEXT
);

CREATE TABLE mangas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    sinopsis TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL,
    imagen_portada TEXT
);

CREATE TABLE lista_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    anime_id INTEGER REFERENCES animes(id),
    estado VARCHAR(20) CHECK (estado IN ('visto', 'pendiente', 'abandonado')),
    fecha_agregado TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, anime_id)
);

CREATE TABLE carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    manga_id INTEGER REFERENCES mangas(id),
    cantidad INTEGER DEFAULT 1,
    agregado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'completado',
    metodo_pago VARCHAR(50),
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    anime_id INTEGER REFERENCES animes(id),
    manga_id INTEGER REFERENCES mangas(id),
    agregado_en TIMESTAMP DEFAULT NOW(),
    CHECK ((anime_id IS NOT NULL)::int + (manga_id IS NOT NULL)::int = 1)
);

CREATE TABLE anime_generos (
    anime_id INTEGER REFERENCES animes(id),
    genero_id INTEGER REFERENCES generos(id),
    PRIMARY KEY (anime_id, genero_id)
);
```

### 5. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=manganime_user
DB_PASSWORD=tu_password
DB_DATABASE=manganime_db
PORT=3000
```

### 6. Instalar Dependencias del Proyecto

```bash
npm install
```

### 7. Iniciar el Servidor

```bash
npm start
```

### 8. Verificar la Instalación

Abrir en el navegador:
- **Página principal:** http://localhost:3000
- **API Animes:** http://localhost:3000/api/animes
- **API Mangas:** http://localhost:3000/api/mangas

## Configuraciones Adicionales (Opcional)

### Insertar Datos de Prueba

Para probar la aplicación, insertar algunos datos:
```bash
psql -U postgres -d manganime_db -f database/seed.sql
```

### Variables de Entorno por Defecto

Si no se crea el archivo `.env`, el servidor usará estos valores:
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_DATABASE=postgres`
- `PORT=3000`

## Notas Importantes

1. **El archivo .env NO debe subirse a repositorios** (está en .gitignore)
2. **PostgreSQL debe estar en ejecución** antes de iniciar el servidor
3. **El proyecto usa `usuarioId` global** - si se crean usuarios en otra computadora, los IDs pueden diferir
4. **Para desarrollo, usar siempre el servidor local** - no abrir archivos HTML directamente

## Solución de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `connect ECONNREFUSED` | PostgreSQL no está ejecutándose | Iniciar servicio PostgreSQL |
| `password authentication failed` | Credenciales incorrectas | Verificar `.env` |
| Los estilos no cargan | Sin internet o CDN caído | Verificar conexión |
| `Cannot GET /` | Rutas mal configuradas | Verificar server.js |
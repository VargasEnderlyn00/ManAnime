-- =============================================
-- TABLAS FALTANTES PARA OTAKUVAULT
-- Ejecuta este script en tu base de datos PostgreSQL
-- =============================================

-- Verificar si existe la tabla usuarios (con campos adicionales)
-- Si ya existe, solo agrega las columnas que faltan
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT NOW();

-- Tabla de carrito (faltante)
CREATE TABLE IF NOT EXISTS carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    manga_id INTEGER REFERENCES mangas(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT NOW()
);

-- Tabla de favoritos (faltante)
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES animes(id) ON DELETE SET NULL,
    manga_id INTEGER REFERENCES mangas(id) ON DELETE SET NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('anime', 'manga')),
    fecha_agregado TIMESTAMP DEFAULT NOW()
);

-- Tabla de lista de usuario (faltante)
CREATE TABLE IF NOT EXISTS lista_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES animes(id) ON DELETE SET NULL,
    estado VARCHAR(20) CHECK (estado IN ('visto', 'pendiente', 'abandonado')),
    fecha_agregado TIMESTAMP DEFAULT NOW()
);

-- Agregar columnas faltantes a animes si no existen
ALTER TABLE animes ADD COLUMN IF NOT EXISTS calificacion_promedio DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE animes ADD COLUMN IF NOT EXISTS fecha_lanzamiento DATE;
ALTER TABLE animes ADD COLUMN IF NOT EXISTS sinopsis TEXT;

-- Agregar columnas faltantes a mangas si no existen
ALTER TABLE mangas ADD COLUMN IF NOT EXISTS sinopsis TEXT;

-- =============================================
-- VERIFICAR ESTRUCTURA
-- =============================================
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('animes', 'mangas', 'usuarios') 
AND column_name IN ('calificacion_promedio', 'precio', 'stock', 'sinopsis', 'fecha_lanzamiento')
ORDER BY table_name, ordinal_position;
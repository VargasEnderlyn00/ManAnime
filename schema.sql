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

-- Tabla de ordenes (faltante)
CREATE TABLE IF NOT EXISTS ordenes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT NOW(),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    metodo_pago VARCHAR(50)
);

-- Tabla de movimientos_inventario (faltante)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    manga_id INTEGER REFERENCES mangas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    orden_id INTEGER REFERENCES ordenes(id) ON DELETE CASCADE,
    descripcion TEXT
);

-- Tabla de orden_detalle (faltante)
CREATE TABLE IF NOT EXISTS orden_detalle (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES ordenes(id) ON DELETE CASCADE,
    manga_id INTEGER REFERENCES mangas(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Trigger para actualizar stock al crear detalle de orden
CREATE OR REPLACE FUNCTION actualizar_stock_venta() RETURNS TRIGGER AS $$
BEGIN
    UPDATE mangas SET stock = stock - NEW.cantidad WHERE id = NEW.manga_id;
    INSERT INTO movimientos_inventario (manga_id, tipo, cantidad, usuario_id, orden_id, descripcion)
    VALUES (NEW.manga_id, 'venta', NEW.cantidad,
            (SELECT usuario_id FROM ordenes WHERE id = NEW.orden_id),
            NEW.orden_id, 'Venta realizada');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
    AFTER INSERT ON orden_detalle
    FOR EACH ROW EXECUTE FUNCTION actualizar_stock_venta();

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

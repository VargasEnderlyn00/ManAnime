const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./config/database');
const Usuario = require('./models/User');
const Anime = require('./models/Anime');
const Manga = require('./models/Manga');
const Genero = require('./models/Genero');
const Plataforma = require('./models/Plataforma');
const Rol = require('./models/Role');
const Carrito = require('./models/Carrito');
const Favorito = require('./models/Favorito');
const ListaUsuario = require('./models/ListaUsuario');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Ruta principal - sirve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ==================== AUTENTICACIÓN ====================
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, nombre_completo } = req.body;
        
        // Hashear la contraseña antes de guardar
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        const result = await pool.query(
            'INSERT INTO usuarios (username, email, password_hash, nombre_completo) VALUES ($1, $2, $3, $4) RETURNING id, username, email, nombre_completo',
            [username, email, password_hash, nombre_completo]
        );
        
        res.status(201).json({ 
            mensaje: "Usuario creado exitosamente",
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear usuario" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, username, email, nombre_completo, password_hash FROM usuarios WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        const usuario = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        // No enviar el hash de la contraseña en la respuesta
        const { password_hash, ...usuarioSinPassword } = usuario;
        
        res.json({ 
            mensaje: "Login exitoso",
            usuario: usuarioSinPassword
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el login" });
    }
});

// ==================== ANIMES ====================
app.get('/api/animes', async (req, res) => {
    try {
        const animes = await Anime.findAll({
            genero: req.query.genero,
            ano: req.query.ano,
            buscar: req.query.buscar,
            limit: req.query.limit
        });
        res.json(animes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener animes" });
    }
});

app.get('/api/animes/:id', async (req, res) => {
// ==================== G�NEROS ====================
app.get('/api/generos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM generos ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo g�neros:', error);
        res.status(500).json({ error: 'Error al obtener g�neros' });
    }
});
    try {
        const anime = await Anime.findById(req.params.id);
        if (!anime) {
            return res.status(404).json({ error: "Anime no encontrado" });
        }
        res.json(anime);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener anime" });
    }
});

// ==================== MANGAS ====================
app.get('/api/mangas', async (req, res) => {
    try {
        const mangas = await Manga.findAll({
            genero: req.query.genero,
            buscar: req.query.buscar
        });
        res.json(mangas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener mangas" });
    }
});

app.get('/api/mangas/:id', async (req, res) => {
    try {
        const manga = await Manga.findById(req.params.id);
        if (!manga) {
            return res.status(404).json({ error: "Manga no encontrado" });
        }
        res.json(manga);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener manga" });
    }
});

// ==================== CARRITO ====================
app.get('/api/carrito/:usuario_id', async (req, res) => {
    try {
        const carrito = await Carrito.findByUsuarioId(req.params.usuario_id);
        res.json(carrito);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener carrito" });
    }
});

app.post('/api/carrito', async (req, res) => {
    try {
        const { usuario_id, manga_id, cantidad } = req.body;
        
        // Verificar si ya existe en el carrito
        const existente = await Carrito.findByUsuarioAndManga(usuario_id, manga_id);
        if (existente) {
            // Actualizar cantidad
            const nuevoCantidad = existente.cantidad + (cantidad || 1);
            const result = await Carrito.update(existente.id, { cantidad: nuevoCantidad });
            res.json({ 
                mensaje: "Cantidad actualizada en el carrito",
                item: result
            });
        } else {
            // Crear nuevo item
            const result = await Carrito.create({ usuario_id, manga_id, cantidad });
            res.status(201).json({ 
                mensaje: "Manga agregado al carrito",
                item: result
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al agregar al carrito" });
    }
});

app.delete('/api/carrito/:id', async (req, res) => {
    try {
        await Carrito.delete(req.params.id);
        res.json({ mensaje: "Item eliminado del carrito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar del carrito" });
    }
});

// ==================== ÓRDENES ====================
app.post('/api/ordenes', async (req, res) => {
    try {
        const { usuario_id } = req.body;

        // Obtener carrito del usuario
        const carritoItems = await Carrito.findByUsuarioId(usuario_id);

        if (carritoItems.length === 0) {
            return res.status(400).json({ error: "El carrito está vacío" });
        }

        // Validar stock disponible
        for (const item of carritoItems) {
            const manga = await Manga.findById(item.manga_id);
            if (!manga || manga.stock < item.cantidad) {
                return res.status(400).json({
                    error: `Stock insuficiente para: ${item.titulo}. Stock disponible: ${manga ? manga.stock : 0}`
                });
            }
        }

        // Calcular total
        const total = carritoItems.reduce((sum, item) => {
            return sum + (parseFloat(item.precio) * item.cantidad);
        }, 0);

        // Iniciar transacción
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Crear orden
            const ordenResult = await client.query(
                'INSERT INTO ordenes (usuario_id, total, estado, metodo_pago) VALUES ($1, $2, $3, $4) RETURNING id, fecha',
                [usuario_id, total, 'completado', 'tarjeta']
            );

            const orden = ordenResult.rows[0];
            const ordenId = orden.id;

            // Crear detalles de orden (el trigger actualizará stock y creará movimientos)
            for (const item of carritoItems) {
                const subtotal = parseFloat(item.precio) * item.cantidad;

                await client.query(
                    `INSERT INTO orden_detalle (orden_id, manga_id, cantidad, precio_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [ordenId, item.manga_id, item.cantidad, item.precio, subtotal]
                );
            }

            // Vaciar carrito
            await client.query('DELETE FROM carrito WHERE usuario_id = $1', [usuario_id]);

            await client.query('COMMIT');

            res.status(201).json({
                mensaje: "Compra realizada exitosamente",
                orden: { id: ordenId, total, estado: 'completado', fecha: orden.fecha }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error en orden:", error);
        res.status(500).json({ error: "Error al procesar la compra" });
    }
});

// Obtener órdenes de un usuario
app.get('/api/ordenes/:usuario_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*,
                    ARRAY_AGG(
                        JSON_BUILD_OBJECT(
                            'id', od.id,
                            'manga_id', od.manga_id,
                            'cantidad', od.cantidad,
                            'precio_unitario', od.precio_unitario,
                            'subtotal', od.subtotal,
                            'titulo', m.titulo,
                            'imagen_portada', m.imagen_portada
                        )
                    ) as detalles
             FROM ordenes o
             LEFT JOIN orden_detalle od ON o.id = od.orden_id
             LEFT JOIN mangas m ON od.manga_id = m.id
             WHERE o.usuario_id = $1
             GROUP BY o.id
             ORDER BY o.fecha DESC`,
            [req.params.usuario_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo órdenes:", error);
        res.status(500).json({ error: "Error al obtener historial de compras" });
    }
});

// Eliminar item del carrito (ya existe, solo asegurar)
app.delete('/api/carrito/:id', async (req, res) => {
    try {
        await Carrito.delete(req.params.id);
        res.json({ mensaje: "Item eliminado del carrito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar del carrito" });
    }
});

// ==================== FAVORITOS ====================
app.get('/api/favoritos/:usuario_id', async (req, res) => {
    try {
        const favoritos = await Favorito.findByUsuarioId(req.params.usuario_id);
        res.json(favoritos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener favoritos" });
    }
});

app.post('/api/favoritos', async (req, res) => {
    try {
        const { usuario_id, anime_id, manga_id } = req.body;
        
        // Verificar que solo se proporcione uno de los dos
        if ((anime_id && manga_id) || (!anime_id && !manga_id)) {
            return res.status(400).json({ error: "Debe especificar exactamente uno: anime_id o manga_id" });
        }
        
        // Verificar si ya existe
        let existente;
        if (anime_id) {
            existente = await Favorito.findByUsuarioAndAnime(usuario_id, anime_id);
        } else {
            existente = await Favorito.findByUsuarioAndManga(usuario_id, manga_id);
        }
        
        if (existente) {
            return res.status(409).json({ error: "El elemento ya está en favoritos" });
        }
        
        const result = await Favorito.create({ usuario_id, anime_id, manga_id });
        res.status(201).json({ 
            mensaje: "Elemento agregado a favoritos",
            favorito: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al agregar a favoritos" });
    }
});

app.delete('/api/favoritos/:id', async (req, res) => {
    try {
        await Favorito.delete(req.params.id);
        res.json({ mensaje: "Elemento eliminado de favoritos" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar de favoritos" });
    }
});

app.delete('/api/favoritos/anime/:usuario_id/:anime_id', async (req, res) => {
    try {
        await Favorito.deleteByUsuarioAndAnime(req.params.usuario_id, req.params.anime_id);
        res.json({ mensaje: "Anime eliminado de favoritos" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar de favoritos" });
    }
});

app.delete('/api/favoritos/manga/:usuario_id/:manga_id', async (req, res) => {
    try {
        await Favorito.deleteByUsuarioAndManga(req.params.usuario_id, req.params.manga_id);
        res.json({ mensaje: "Manga eliminado de favoritos" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar de favoritos" });
    }
});

// ==================== LISTA DE USUARIO ====================
app.get('/api/lista/:usuario_id', async (req, res) => {
    try {
        const listas = await ListaUsuario.findByUsuarioId(req.params.usuario_id);
        // Para cada lista, obtener sus items
        const listasConItems = await Promise.all(listas.map(async (lista) => {
            const items = await pool.query(
                `SELECT li.id as item_id, li.agregado_en as item_agregado_en,
                        COALESCE(a.titulo, m.titulo) as titulo,
                        COALESCE(a.imagen_url, m.imagen_portada) as imagen
                 FROM lista_items li
                 LEFT JOIN animes a ON li.anime_id = a.id
                 LEFT JOIN mangas m ON li.manga_id = m.id
                 WHERE li.lista_id = $1
                 ORDER BY li.agregado_en DESC`,
                [lista.id]
            );
            return {
                ...lista,
                items: items.rows
            };
        }));
        res.json(listasConItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener lista" });
    }
});

// Crear nueva lista
app.post('/api/lista', async (req, res) => {
    try {
        const { usuario_id, nombre_lista, tipo } = req.body;
        const result = await ListaUsuario.create({ usuario_id, nombre_lista, tipo });
        res.status(201).json({ 
            mensaje: "Lista creada exitosamente",
            lista: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear lista" });
    }
});

// Agregar item a lista
app.post('/api/lista/item', async (req, res) => {
    try {
        const { lista_id, anime_id, manga_id } = req.body;
        
        // Verificar que solo se proporcione uno de los dos
        if ((anime_id && manga_id) || (!anime_id && !manga_id)) {
            return res.status(400).json({ error: "Debe especificar exactamente uno: anime_id o manga_id" });
        }
        
        const result = await pool.query(
            'INSERT INTO lista_items (lista_id, anime_id, manga_id) VALUES ($1, $2, $3) RETURNING *',
            [lista_id, anime_id, manga_id]
        );
        
        res.status(201).json({ 
            mensaje: "Item agregado a la lista",
            item: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al agregar item a lista" });
    }
});

// Eliminar item de lista
app.delete('/api/lista/item/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM lista_items WHERE id = $1', [req.params.id]);
        res.json({ mensaje: "Item eliminado de la lista" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar item de lista" });
    }
});

// Eliminar lista completa
app.delete('/api/lista/:id', async (req, res) => {
    try {
        await ListaUsuario.delete(req.params.id);
        res.json({ mensaje: "Lista eliminada exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar lista" });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

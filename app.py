import os
import psycopg2
from psycopg2 import pool as pg_pool
from dotenv import load_dotenv
from flask import Flask, jsonify, request, render_template, send_from_directory

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

db_pool = pg_pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=20,
    dsn=DATABASE_URL
)

def get_db_connection():
    return db_pool.getconn()

def release_db_connection(conn):
    db_pool.putconn(conn)

app = Flask(__name__, static_folder='frontend', template_folder='frontend')
app.config['SECRET_KEY'] = os.urandom(24).hex()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/inicio.html')
def inicio():
    return render_template('inicio.html')

@app.route('/pages/<path:filename>')
def pages(filename):
    return render_template(f'pages/{filename}')

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        nombre_completo = data.get('nombre_completo')
        
        import bcrypt
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO usuarios (username, email, password_hash, nombre_completo) VALUES (%s, %s, %s, %s) RETURNING id, username, email, nombre_completo',
                    [username, email, password_hash, nombre_completo]
                )
                result = cur.fetchone()
                conn.commit()
            
            return jsonify({
                'mensaje': 'Usuario creado exitosamente',
                'usuario': {'id': result[0], 'username': result[1], 'email': result[2], 'nombre_completo': result[3]}
            }), 201
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error en register: {e}")
        return jsonify({'error': 'Error al crear usuario'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT id, username, email, nombre_completo, password_hash FROM usuarios WHERE email = %s',
                    [email]
                )
                result = cur.fetchone()
        finally:
            release_db_connection(conn)
        
        if not result:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        usuario = result
        import bcrypt
        if bcrypt.checkpw(password.encode('utf-8'), usuario[4].encode('utf-8')):
            return jsonify({
                'mensaje': 'Login exitoso',
                'usuario': {'id': usuario[0], 'username': usuario[1], 'email': usuario[2], 'nombre_completo': usuario[3]}
            })
        else:
            return jsonify({'error': 'Credenciales inválidas'}), 401
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({'error': 'Error en el login'}), 500

@app.route('/api/animes')
def get_animes():
    try:
        genero = request.args.get('genero')
        ano = request.args.get('ano')
        buscar = request.args.get('buscar')
        limit = request.args.get('limit')
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = """SELECT a.id, a.titulo, a.titulo_japones, a.sinopsis, a.ano_lanzamiento, a.temporadas, a.episodios, a.estado, a.calificacion_promedio, a.imagen_url, a.trailer_url, COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
                           FROM animes a
                           LEFT JOIN anime_generos ag ON a.id = ag.anime_id
                           LEFT JOIN generos g ON ag.genero_id = g.id"""
                conditions = []
                values = []
                
                if genero:
                    conditions.append("a.id IN (SELECT anime_id FROM anime_generos ag2 JOIN generos g2 ON ag2.genero_id = g2.id WHERE g2.nombre ILIKE %s)")
                    values.append(genero)
                if buscar:
                    conditions.append("a.titulo ILIKE %s")
                    values.append(f"%{buscar}%")
                
                if conditions:
                    query += ' WHERE ' + ' AND '.join(conditions)
                query += ' GROUP BY a.id, a.titulo, a.titulo_japones, a.sinopsis, a.ano_lanzamiento, a.temporadas, a.episodios, a.estado, a.calificacion_promedio, a.imagen_url, a.trailer_url ORDER BY a.titulo'
                
                if limit:
                    query += f' LIMIT {int(limit)}'
                
                cur.execute(query, values)
                rows = cur.fetchall()
                columns = ['id', 'titulo', 'titulo_japones', 'sinopsis', 'ano_lanzamiento', 'temporadas', 'episodios', 'estado', 'calificacion_promedio', 'imagen_url', 'trailer_url', 'generos']
                animes = [dict(zip(columns, row)) for row in rows]
        finally:
            release_db_connection(conn)
        
        return jsonify(animes)
    except Exception as e:
        print(f"Error obteniendo animes: {e}")
        return jsonify({'error': 'Error al obtener animes'}), 500

@app.route('/api/animes/<int:anime_id>')
def get_anime(anime_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT a.id, a.titulo, a.titulo_japones, a.sinopsis, a.ano_lanzamiento, a.temporadas, a.episodios, a.estado, a.calificacion_promedio, a.imagen_url, a.trailer_url, COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
                      FROM animes a
                      LEFT JOIN anime_generos ag ON a.id = ag.anime_id
                      LEFT JOIN generos g ON ag.genero_id = g.id
                      WHERE a.id = %s
                      GROUP BY a.id, a.titulo, a.titulo_japones, a.sinopsis, a.ano_lanzamiento, a.temporadas, a.episodios, a.estado, a.calificacion_promedio, a.imagen_url, a.trailer_url""",
                    [anime_id]
                )
                row = cur.fetchone()
        finally:
            release_db_connection(conn)
        
        if not row:
            return jsonify({'error': 'Anime no encontrado'}), 404
        
        columns = ['id', 'titulo', 'titulo_japones', 'sinopsis', 'ano_lanzamiento', 'temporadas', 'episodios', 'estado', 'calificacion_promedio', 'imagen_url', 'trailer_url', 'generos']
        return jsonify(dict(zip(columns, row)))
    except Exception as e:
        print(f"Error obteniendo anime: {e}")
        return jsonify({'error': 'Error al obtener anime'}), 500

@app.route('/api/generos')
def get_generos():
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM generos ORDER BY nombre')
                result = cur.fetchall()
        finally:
            release_db_connection(conn)
        return jsonify([{'id': r[0], 'nombre': r[1]} for r in result])
    except Exception as e:
        print(f"Error obteniendo géneros: {e}")
        return jsonify({'error': 'Error al obtener géneros'}), 500

@app.route('/api/mangas')
def get_mangas():
    try:
        genero = request.args.get('genero')
        buscar = request.args.get('buscar')
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = """SELECT m.id, m.titulo, m.volumen, m.autor, m.precio, m.stock, m.sinopsis_corta, m.imagen_portada, m.isbn, m.ano_publicacion, m.calificacion, COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
                           FROM mangas m
                           LEFT JOIN manga_generos mg ON m.id = mg.manga_id
                           LEFT JOIN generos g ON mg.genero_id = g.id"""
                conditions = []
                values = []
                
                if genero:
                    conditions.append("m.id IN (SELECT manga_id FROM manga_generos mg2 JOIN generos g2 ON mg2.genero_id = g2.id WHERE g2.nombre ILIKE %s)")
                    values.append(genero)
                if buscar:
                    conditions.append("m.titulo ILIKE %s")
                    values.append(f"%{buscar}%")
                
                if conditions:
                    query += ' WHERE ' + ' AND '.join(conditions)
                query += ' GROUP BY m.id, m.titulo, m.volumen, m.autor, m.precio, m.stock, m.sinopsis_corta, m.imagen_portada, m.isbn, m.ano_publicacion, m.calificacion ORDER BY m.titulo'
                
                cur.execute(query, values)
                rows = cur.fetchall()
                columns = ['id', 'titulo', 'volumen', 'autor', 'precio', 'stock', 'sinopsis_corta', 'imagen_portada', 'isbn', 'ano_publicacion', 'calificacion', 'generos']
                mangas = [dict(zip(columns, row)) for row in rows]
        finally:
            release_db_connection(conn)
        
        return jsonify(mangas)
    except Exception as e:
        print(f"Error obteniendo mangas: {e}")
        return jsonify({'error': 'Error al obtener mangas'}), 500

@app.route('/api/mangas/<int:manga_id>')
def get_manga(manga_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT m.id, m.titulo, m.volumen, m.autor, m.precio, m.stock, m.sinopsis_corta, m.imagen_portada, m.isbn, m.ano_publicacion, m.calificacion, COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
                      FROM mangas m
                      LEFT JOIN manga_generos mg ON m.id = mg.manga_id
                      LEFT JOIN generos g ON mg.genero_id = g.id
                      WHERE m.id = %s
                      GROUP BY m.id, m.titulo, m.volumen, m.autor, m.precio, m.stock, m.sinopsis_corta, m.imagen_portada, m.isbn, m.ano_publicacion, m.calificacion""",
                    [manga_id]
                )
                row = cur.fetchone()
        finally:
            release_db_connection(conn)
        
        if not row:
            return jsonify({'error': 'Manga no encontrado'}), 404
        
        columns = ['id', 'titulo', 'volumen', 'autor', 'precio', 'stock', 'sinopsis_corta', 'imagen_portada', 'isbn', 'ano_publicacion', 'calificacion', 'generos']
        return jsonify(dict(zip(columns, row)))
    except Exception as e:
        print(f"Error obteniendo manga: {e}")
        return jsonify({'error': 'Error al obtener manga'}), 500

@app.route('/api/carrito/<int:usuario_id>')
def get_carrito(usuario_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT c.id, c.usuario_id, c.manga_id, c.cantidad, m.titulo, m.precio, m.imagen_portada
                      FROM carrito c
                      JOIN mangas m ON c.manga_id = m.id
                      WHERE c.usuario_id = %s""",
                    [usuario_id]
                )
                rows = cur.fetchall()
                carrito = [{'id': r[0], 'usuario_id': r[1], 'manga_id': r[2], 'cantidad': r[3], 'precio': float(r[5]), 'titulo': r[4], 'imagen_portada': r[6]} for r in rows]
        finally:
            release_db_connection(conn)
        return jsonify(carrito)
    except Exception as e:
        print(f"Error obteniendo carrito: {e}")
        return jsonify({'error': 'Error al obtener carrito'}), 500

@app.route('/api/carrito', methods=['POST'])
def add_carrito():
    try:
        data = request.get_json()
        usuario_id = data.get('usuario_id')
        manga_id = data.get('manga_id')
        cantidad = data.get('cantidad', 1)
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT * FROM carrito WHERE usuario_id = %s AND manga_id = %s',
                    [usuario_id, manga_id]
                )
                existente = cur.fetchone()
                
                if existente:
                    nuevo_cantidad = existente[3] + cantidad
                    cur.execute(
                        'UPDATE carrito SET cantidad = %s WHERE id = %s RETURNING *',
                        [nuevo_cantidad, existente[0]]
                    )
                    result = cur.fetchone()
                    conn.commit()
                    return jsonify({'mensaje': 'Cantidad actualizada en el carrito', 'item': {'id': result[0], 'usuario_id': result[1], 'manga_id': result[2], 'cantidad': result[3]}})
                else:
                    cur.execute(
                        'INSERT INTO carrito (usuario_id, manga_id, cantidad) VALUES (%s, %s, %s) RETURNING *',
                        [usuario_id, manga_id, cantidad]
                    )
                    result = cur.fetchone()
                    conn.commit()
                    return jsonify({'mensaje': 'Manga agregado al carrito', 'item': {'id': result[0], 'usuario_id': result[1], 'manga_id': result[2], 'cantidad': result[3]}}), 201
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error agregando al carrito: {e}")
        return jsonify({'error': 'Error al agregar al carrito'}), 500

@app.route('/api/carrito/<int:item_id>', methods=['DELETE'])
def delete_carrito(item_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM carrito WHERE id = %s', [item_id])
                conn.commit()
            return jsonify({'mensaje': 'Item eliminado del carrito'})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error eliminando del carrito: {e}")
        return jsonify({'error': 'Error al eliminar del carrito'}), 500

@app.route('/api/ordenes', methods=['POST'])
def create_orden():
    try:
        data = request.get_json()
        usuario_id = data.get('usuario_id')
        
        conn = get_db_connection()
        try:
            conn.autocommit = False
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT c.id, c.usuario_id, c.manga_id, c.cantidad, m.titulo, m.precio, m.imagen_portada FROM carrito c JOIN mangas m ON c.manga_id = m.id WHERE c.usuario_id = %s',
                    [usuario_id]
                )
                carrito_items = cur.fetchall()
                
                if len(carrito_items) == 0:
                    return jsonify({'error': 'El carrito está vacío'}), 400
                
                for item in carrito_items:
                    cur.execute('SELECT stock FROM mangas WHERE id = %s', [item[2]])
                    manga_stock = cur.fetchone()
                    if not manga_stock or manga_stock[0] < item[3]:
                        return jsonify({'error': 'Stock insuficiente'}), 400
                
                total = sum(float(item[5]) * item[3] for item in carrito_items)
                
                cur.execute(
                    'INSERT INTO ordenes (usuario_id, total, estado, metodo_pago) VALUES (%s, %s, %s, %s) RETURNING id, fecha',
                    [usuario_id, total, 'completado', 'tarjeta']
                )
                orden = cur.fetchone()
                orden_id = orden[0]
                
                for item in carrito_items:
                    subtotal = float(item[5]) * item[3]
                    cur.execute(
                        'INSERT INTO orden_detalle (orden_id, manga_id, cantidad, precio_unitario, subtotal) VALUES (%s, %s, %s, %s, %s)',
                        [orden_id, item[2], item[3], float(item[5]), subtotal]
                    )
                
                cur.execute('DELETE FROM carrito WHERE usuario_id = %s', [usuario_id])
                
                conn.commit()
            
            return jsonify({
                'mensaje': 'Compra realizada exitosamente',
                'orden': {'id': orden_id, 'total': total, 'estado': 'completado', 'fecha': orden[1]}
            }), 201
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error en orden: {e}")
        return jsonify({'error': 'Error al procesar la compra'}), 500

@app.route('/api/ordenes/<int:usuario_id>')
def get_ordenes(usuario_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT o.id, o.usuario_id, o.fecha, o.total, o.estado, o.metodo_pago,
                              COALESCE(JSON_AGG(
                                  JSON_BUILD_OBJECT(
                                      'id', od.id,
                                      'manga_id', od.manga_id,
                                      'cantidad', od.cantidad,
                                      'precio_unitario', od.precio_unitario,
                                      'subtotal', od.subtotal,
                                      'titulo', m.titulo,
                                      'imagen_portada', m.imagen_portada
                                  )
                              )::jsonb, '[]'::jsonb) as detalles
                       FROM ordenes o
                       LEFT JOIN orden_detalle od ON o.id = od.orden_id
                       LEFT JOIN mangas m ON od.manga_id = m.id
                       WHERE o.usuario_id = %s
                       GROUP BY o.id, o.usuario_id, o.fecha, o.total, o.estado, o.metodo_pago
                       ORDER BY o.fecha DESC""",
                    [usuario_id]
                )
                rows = cur.fetchall()
                columns = ['id', 'usuario_id', 'fecha', 'total', 'estado', 'metodo_pago', 'detalles']
                ordenes = [dict(zip(columns, row)) for row in rows]
        finally:
            release_db_connection(conn)
        
        return jsonify(ordenes)
    except Exception as e:
        print(f"Error obteniendo órdenes: {e}")
        return jsonify({'error': 'Error al obtener historial de compras'}), 500

@app.route('/api/favoritos/<int:usuario_id>')
def get_favoritos(usuario_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT f.id, f.usuario_id, f.anime_id, f.manga_id, f.fecha_agregado,
                              COALESCE(a.titulo, m.titulo) as titulo,
                              COALESCE(a.imagen_url, m.imagen_portada) as imagen
                      FROM favoritos f
                      LEFT JOIN animes a ON f.anime_id = a.id
                      LEFT JOIN mangas m ON f.manga_id = m.id
                      WHERE f.usuario_id = %s""",
                    [usuario_id]
                )
                rows = cur.fetchall()
                favoritos = [{'id': r[0], 'usuario_id': r[1], 'anime_id': r[2], 'manga_id': r[3], 'titulo': r[5], 'imagen': r[6]} for r in rows]
        finally:
            release_db_connection(conn)
        return jsonify(favoritos)
    except Exception as e:
        print(f"Error obteniendo favoritos: {e}")
        return jsonify({'error': 'Error al obtener favoritos'}), 500

@app.route('/api/favoritos', methods=['POST'])
def add_favorito():
    try:
        data = request.get_json()
        usuario_id = data.get('usuario_id')
        anime_id = data.get('anime_id')
        manga_id = data.get('manga_id')
        
        if (anime_id and manga_id) or (not anime_id and not manga_id):
            return jsonify({'error': 'Debe especificar exactamente uno: anime_id o manga_id'}), 400
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                if anime_id:
                    cur.execute(
                        'SELECT * FROM favoritos WHERE usuario_id = %s AND anime_id = %s',
                        [usuario_id, anime_id]
                    )
                else:
                    cur.execute(
                        'SELECT * FROM favoritos WHERE usuario_id = %s AND manga_id = %s',
                        [usuario_id, manga_id]
                    )
                existente = cur.fetchone()
                
                if existente:
                    return jsonify({'error': 'El elemento ya está en favoritos'}), 409
                
                cur.execute(
                    'INSERT INTO favoritos (usuario_id, anime_id, manga_id) VALUES (%s, %s, %s) RETURNING *',
                    [usuario_id, anime_id, manga_id]
                )
                result = cur.fetchone()
                conn.commit()
        finally:
            release_db_connection(conn)
        
        return jsonify({'mensaje': 'Elemento agregado a favoritos', 'favorito': {'id': result[0], 'usuario_id': result[1], 'anime_id': result[2], 'manga_id': result[3]}}), 201
    except Exception as e:
        print(f"Error agregando a favoritos: {e}")
        return jsonify({'error': 'Error al agregar a favoritos'}), 500

@app.route('/api/favoritos/<int:favorito_id>', methods=['DELETE'])
def delete_favorito(favorito_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM favoritos WHERE id = %s', [favorito_id])
                conn.commit()
            return jsonify({'mensaje': 'Elemento eliminado de favoritos'})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error eliminando favorito: {e}")
        return jsonify({'error': 'Error al eliminar de favoritos'}), 500

@app.route('/api/favoritos/anime/<int:usuario_id>/<int:anime_id>', methods=['DELETE'])
def delete_favorito_anime(usuario_id, anime_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM favoritos WHERE usuario_id = %s AND anime_id = %s', [usuario_id, anime_id])
                conn.commit()
            return jsonify({'mensaje': 'Anime eliminado de favoritos'})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error eliminando favorito: {e}")
        return jsonify({'error': 'Error al eliminar de favoritos'}), 500

@app.route('/api/favoritos/manga/<int:usuario_id>/<int:manga_id>', methods=['DELETE'])
def delete_favorito_manga(usuario_id, manga_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM favoritos WHERE usuario_id = %s AND manga_id = %s', [usuario_id, manga_id])
                conn.commit()
            return jsonify({'mensaje': 'Manga eliminado de favoritos'})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error eliminando favorito: {e}")
        return jsonify({'error': 'Error al eliminar de favoritos'}), 500

@app.route('/api/lista-usuario/<int:usuario_id>')
def get_lista_usuario(usuario_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT lu.*, a.titulo, a.imagen_url
                      FROM lista_usuario lu
                      LEFT JOIN animes a ON lu.anime_id = a.id
                      WHERE lu.usuario_id = %s
                      ORDER BY lu.fecha_agregado DESC""",
                    [usuario_id]
                )
                rows = cur.fetchall()
            
            visto = []
            pendiente = []
            abandonado = []
            
            for r in rows:
                item = {'id': r[0], 'usuario_id': r[1], 'anime_id': r[2], 'estado': r[3], 'fecha_agregado': str(r[4]), 'titulo': r[5], 'imagen': r[6]}
                if r[3] == 'visto':
                    visto.append(item)
                elif r[3] == 'pendiente':
                    pendiente.append(item)
                elif r[3] == 'abandonado':
                    abandonado.append(item)
            
            return jsonify({'visto': visto, 'pendiente': pendiente, 'abandonado': abandonado})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error obteniendo lista: {e}")
        return jsonify({'error': 'Error al obtener lista'}), 500

@app.route('/api/lista', methods=['POST'])
def add_lista():
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                if 'anime_id' in data:
                    usuario_id = data.get('usuario_id')
                    anime_id = data.get('anime_id')
                    estado = data.get('estado')
                    
                    cur.execute(
                        'SELECT * FROM lista_usuario WHERE usuario_id = %s AND anime_id = %s',
                        [usuario_id, anime_id]
                    )
                    existente = cur.fetchone()
                    
                    if existente:
                        cur.execute(
                            'UPDATE lista_usuario SET estado = %s WHERE id = %s RETURNING *',
                            [estado, existente[0]]
                        )
                        result = cur.fetchone()
                        conn.commit()
                        return jsonify({'mensaje': 'Estado actualizado', 'lista': {'id': result[0], 'usuario_id': result[1], 'anime_id': result[2], 'estado': result[3]}})
                    
                    cur.execute(
                        'INSERT INTO lista_usuario (usuario_id, anime_id, estado) VALUES (%s, %s, %s) RETURNING *',
                        [usuario_id, anime_id, estado]
                    )
                    result = cur.fetchone()
                    conn.commit()
                    return jsonify({'mensaje': 'Anime agregado a tu lista', 'lista': {'id': result[0], 'usuario_id': result[1], 'anime_id': result[2], 'estado': result[3]}}), 201
                else:
                    usuario_id = data.get('usuario_id')
                    nombre_lista = data.get('nombre_lista')
                    tipo = data.get('tipo')
                    
                    cur.execute(
                        'INSERT INTO listas_usuario (usuario_id, nombre_lista, tipo) VALUES (%s, %s, %s) RETURNING *',
                        [usuario_id, nombre_lista, tipo]
                    )
                    result = cur.fetchone()
                    conn.commit()
                    return jsonify({'mensaje': 'Lista creada exitosamente', 'lista': {'id': result[0], 'usuario_id': result[1], 'nombre_lista': result[2], 'tipo': result[3]}}), 201
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error agregando a lista: {e}")
        return jsonify({'error': 'Error al agregar a lista'}), 500

@app.route('/api/lista/<int:usuario_id>/<int:anime_id>', methods=['PUT'])
def update_lista(usuario_id, anime_id):
    try:
        estado = request.get_json().get('estado')
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE lista_usuario SET estado = %s WHERE usuario_id = %s AND anime_id = %s RETURNING *',
                    [estado, usuario_id, anime_id]
                )
                result = cur.fetchone()
                conn.commit()
            
            if not result:
                return jsonify({'error': 'Elemento no encontrado en tu lista'}), 404
            
            return jsonify({'mensaje': 'Estado actualizado', 'lista': {'id': result[0], 'usuario_id': result[1], 'anime_id': result[2], 'estado': result[3]}})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error actualizando lista: {e}")
        return jsonify({'error': 'Error al actualizar lista'}), 500

@app.route('/api/lista/item', methods=['POST'])
def add_lista_item():
    try:
        data = request.get_json()
        lista_id = data.get('lista_id')
        anime_id = data.get('anime_id')
        manga_id = data.get('manga_id')
        
        if (anime_id and manga_id) or (not anime_id and not manga_id):
            return jsonify({'error': 'Debe especificar exactamente uno: anime_id o manga_id'}), 400
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO lista_items (lista_id, anime_id, manga_id) VALUES (%s, %s, %s) RETURNING *',
                    [lista_id, anime_id, manga_id]
                )
                result = cur.fetchone()
                conn.commit()
            return jsonify({'mensaje': 'Item agregado a la lista', 'item': result}), 201
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error agregando item a lista: {e}")
        return jsonify({'error': 'Error al agregar item a lista'}), 500

@app.route('/api/lista/item/<int:item_id>', methods=['DELETE'])
def delete_lista_item(item_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM lista_items WHERE id = %s', [item_id])
                conn.commit()
            return jsonify({'mensaje': 'Item eliminado de la lista'})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error eliminando item de lista: {e}")
        return jsonify({'error': 'Error al eliminar item de lista'}), 500

@app.route('/api/lista/<int:lista_id>', methods=['DELETE'])
def delete_lista(lista_id):
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM listas_usuario WHERE id = %s', [lista_id])
                conn.commit()
            return jsonify({'mensaje': 'Lista eliminada exitosamente'})
        finally:
            release_db_connection(conn)
    except Exception as e:
        print(f"Error eliminando lista: {e}")
        return jsonify({'error': 'Error al eliminar lista'}), 500

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('frontend/js', filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('frontend/css', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)

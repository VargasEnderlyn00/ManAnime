from models.database import pool

class Carrito:
    @staticmethod
    def find_by_usuario_id(usuario_id):
        result = pool.execute(
            """SELECT c.id, c.usuario_id, c.manga_id, c.cantidad, c.fecha_agregado, m.titulo, m.precio, m.imagen_portada
             FROM carrito c
             JOIN mangas m ON c.manga_id = m.id
             WHERE c.usuario_id = %s""",
            [usuario_id]
        )
        return [{'id': r[0], 'usuario_id': r[1], 'manga_id': r[2], 'cantidad': r[3], 'precio': r[5], 'titulo': r[4], 'imagen_portada': r[6]} for r in result]
    
    @staticmethod
    def find_by_usuario_and_manga(usuario_id, manga_id):
        result = pool.execute(
            'SELECT * FROM carrito WHERE usuario_id = %s AND manga_id = %s',
            [usuario_id, manga_id]
        )
        return result[0] if result else None
    
    @staticmethod
    def create(usuario_id, manga_id, cantidad=1):
        result = pool.execute(
            'INSERT INTO carrito (usuario_id, manga_id, cantidad) VALUES (%s, %s, %s) RETURNING *',
            [usuario_id, manga_id, cantidad]
        )
        return {'id': result[0][0], 'usuario_id': result[0][1], 'manga_id': result[0][2], 'cantidad': result[0][3]}
    
    @staticmethod
    def update(item_id, data):
        result = pool.execute(
            'UPDATE carrito SET cantidad = %s WHERE id = %s RETURNING *',
            [data['cantidad'], item_id]
        )
        return {'id': result[0][0], 'usuario_id': result[0][1], 'manga_id': result[0][2], 'cantidad': result[0][3]}
    
    @staticmethod
    def delete(item_id):
        pool.execute('DELETE FROM carrito WHERE id = %s', [item_id])
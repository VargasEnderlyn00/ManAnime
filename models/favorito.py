from models.database import pool

class Favorito:
    @staticmethod
    def find_by_usuario_id(usuario_id):
        result = pool.execute(
            """SELECT f.id, f.usuario_id, f.anime_id, f.manga_id, f.fecha_agregado,
                      COALESCE(a.titulo, m.titulo) as titulo,
                      COALESCE(a.imagen_url, m.imagen_portada) as imagen
             FROM favoritos f
             LEFT JOIN animes a ON f.anime_id = a.id
             LEFT JOIN mangas m ON f.manga_id = m.id
             WHERE f.usuario_id = %s""",
            [usuario_id]
        )
        return [{'id': r[0], 'usuario_id': r[1], 'anime_id': r[2], 'manga_id': r[3], 'titulo': r[5], 'imagen': r[6]} for r in result]
    
    @staticmethod
    def find_by_usuario_and_anime(usuario_id, anime_id):
        result = pool.execute(
            'SELECT * FROM favoritos WHERE usuario_id = %s AND anime_id = %s',
            [usuario_id, anime_id]
        )
        return result[0] if result else None
    
    @staticmethod
    def find_by_usuario_and_manga(usuario_id, manga_id):
        result = pool.execute(
            'SELECT * FROM favoritos WHERE usuario_id = %s AND manga_id = %s',
            [usuario_id, manga_id]
        )
        return result[0] if result else None
    
    @staticmethod
    def create(usuario_id, anime_id=None, manga_id=None):
        result = pool.execute(
            'INSERT INTO favoritos (usuario_id, anime_id, manga_id) VALUES (%s, %s, %s) RETURNING *',
            [usuario_id, anime_id, manga_id]
        )
        return {'id': result[0][0], 'usuario_id': result[0][1], 'anime_id': result[0][2], 'manga_id': result[0][3]}
    
    @staticmethod
    def delete(favorito_id):
        pool.execute('DELETE FROM favoritos WHERE id = %s', [favorito_id])
    
    @staticmethod
    def delete_by_usuario_and_anime(usuario_id, anime_id):
        pool.execute('DELETE FROM favoritos WHERE usuario_id = %s AND anime_id = %s', [usuario_id, anime_id])
    
    @staticmethod
    def delete_by_usuario_and_manga(usuario_id, manga_id):
        pool.execute('DELETE FROM favoritos WHERE usuario_id = %s AND manga_id = %s', [usuario_id, manga_id])
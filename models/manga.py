from models.database import pool

class Manga:
    @staticmethod
    def find_all(genero=None, buscar=None):
        query = """
            SELECT m.*, 
                   COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
            FROM mangas m
            LEFT JOIN manga_generos mg ON m.id = mg.manga_id
            LEFT JOIN generos g ON mg.genero_id = g.id
        """
        
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
        
        query += ' GROUP BY m.id ORDER BY m.titulo'
        
        result = pool.execute(query, values if values else None)
        return [dict(zip(['id', 'titulo', 'volumen', 'autor', 'precio', 'stock', 'sinopsis_corta', 'imagen_portada', 'isbn', 'ano_publicacion', 'calificacion', 'generos'], row)) for row in result]
    
    @staticmethod
    def find_by_id(manga_id):
        result = pool.execute(
            """SELECT m.*, 
                     COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
             FROM mangas m
             LEFT JOIN manga_generos mg ON m.id = mg.manga_id
             LEFT JOIN generos g ON mg.genero_id = g.id
             WHERE m.id = %s
             GROUP BY m.id""",
            [manga_id]
        )
        
        if not result:
            return None
        
        return dict(zip(['id', 'titulo', 'volumen', 'autor', 'precio', 'stock', 'sinopsis_corta', 'imagen_portada', 'isbn', 'ano_publicacion', 'calificacion', 'generos'], result[0]))
from models.database import pool

class Anime:
    @staticmethod
    def find_all(genero=None, ano=None, buscar=None, limit=None):
        query = """
            SELECT a.*, 
                   COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
            FROM animes a
            LEFT JOIN anime_generos ag ON a.id = ag.anime_id
            LEFT JOIN generos g ON ag.genero_id = g.id
        """
        
        conditions = []
        values = []
        param_count = 1
        
        if genero:
            conditions.append(f"a.id IN (SELECT anime_id FROM anime_generos ag2 JOIN generos g2 ON ag2.genero_id = g2.id WHERE g2.nombre ILIKE %s)")
            values.append(genero)
            param_count += 1
        
        if ano:
            conditions.append(f"a.ano_lanzamiento = %s")
            values.append(ano)
        
        if buscar:
            conditions.append(f"a.titulo ILIKE %s")
            values.append(f"%{buscar}%")
        
        if conditions:
            query += ' WHERE ' + ' AND '.join(conditions)
        
        query += ' GROUP BY a.id ORDER BY a.titulo'
        
        if limit:
            query += f' LIMIT {int(limit)}'
        
        result = pool.execute(query, values if values else None)
        return [dict(zip(['id', 'titulo', 'titulo_japones', 'sinopsis', 'ano_lanzamiento', 'temporadas', 'episodios', 'estado', 'calificacion_promedio', 'imagen_url', 'trailer_url', 'generos'], row)) for row in result]
    
    @staticmethod
    def find_by_id(anime_id):
        result = pool.execute(
            """SELECT a.*, 
                     COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
             FROM animes a
             LEFT JOIN anime_generos ag ON a.id = ag.anime_id
             LEFT JOIN generos g ON ag.genero_id = g.id
             WHERE a.id = %s
             GROUP BY a.id""",
            [anime_id]
        )
        
        if not result:
            return None
        
        return dict(zip(['id', 'titulo', 'titulo_japones', 'sinopsis', 'ano_lanzamiento', 'temporadas', 'episodios', 'estado', 'calificacion_promedio', 'imagen_url', 'trailer_url', 'generos'], result[0]))